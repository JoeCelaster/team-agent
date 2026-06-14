import { NextResponse } from "next/server";
import { getSortedProviderCandidates, markProviderFailure, markProviderSuccess } from "@/lib/ai/provider-pool";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "bulk_approve_requests",
      description: "Approve a list of pending access requests in bulk. Works for both standard (role-relevant) and out-of-scope requests once the admin has confirmed.",
      parameters: {
        type: "object",
        properties: {
          request_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of request IDs to approve",
          },
        },
        required: ["request_ids"],
      },
    },
  },
];

async function executeBulkApprove(requestIds: string[], adminId: string): Promise<Record<string, unknown>> {
  if (!requestIds || requestIds.length === 0) {
    return { success: false, message: "No request IDs provided." };
  }

  // Fetch requests to verify they are still pending (standard or out-of-scope)
  const { data: requests } = await supabaseServer
    .from("access_requests")
    .select("id, employee_id, resource_id, is_role_relevant")
    .in("id", requestIds)
    .eq("status", "pending");

  if (!requests || requests.length === 0) {
    return { success: false, message: "No matching pending requests found to approve." };
  }

  const now = new Date().toISOString();
  let approvedCount = 0;

  for (const req of requests) {
    const { error: reqError } = await supabaseServer
      .from("access_requests")
      .update({
        status: "approved",
        reviewed_at: now,
        reviewed_by_id: adminId,
        admin_note: "Bulk approved by Approval Assistant",
      })
      .eq("id", req.id);

    if (reqError) {
      return { success: false, message: `Failed to update request ${req.id}: ${reqError.message}` };
    }

    const { error: accessError } = await supabaseServer
      .from("employee_access")
      .update({ status: "granted", granted_at: now })
      .eq("employee_id", req.employee_id)
      .eq("resource_id", req.resource_id);

    if (accessError) {
      return { success: false, message: `Failed to update access for ${req.employee_id}: ${accessError.message}` };
    }

    approvedCount++;
  }

  return {
    success: true,
    message: `Successfully approved ${approvedCount} request(s).`,
    approved_count: approvedCount
  };
}

export async function POST(request: Request) {
  const { messages, queue, admin_id, org_id } = await request.json();

  if (!admin_id || !org_id) {
    return NextResponse.json({ error: "admin_id and org_id required" }, { status: 400 });
  }

  // System Prompt for Admin Assistant
  const queueJson = JSON.stringify(
    (queue || []).map((r: any) => ({
      request_id: r.request_id,
      employee: r.employee_name,
      role: r.role_name,
      resource: r.resource_name,
      is_standard: r.is_role_relevant,
      note: r.employee_note
    }))
  );

  const systemPrompt = `You are an Approval Assistant for organization admins.
Your job is to help admins review and process pending access requests.

Current Pending Queue:
${queueJson}

Operational Rules:
1. NEVER use markdown tables. Format all queue summaries as grouped lists as shown below.
2. Label each request as "Standard" (mapped to the employee's role) or "Out of Scope" (not mapped to their role) so the admin has full context. BOTH types can be approved — out-of-scope is NOT blocked, it just needs the admin's eyes.
3. NEVER approve requests on your own without confirmation.
4. TWO-STEP VERIFICATION FOR APPROVAL:
   - Step 1 (Declaration): When the admin asks to approve (e.g. "approve all", "approve standard ones", "approve the out-of-scope ones too"), first list exactly which requests you are going to approve (Employee Name → Resource, with a "(out of scope)" tag where relevant) and explicitly ask: "I am going to approve the following requests: [List]. Do you want to proceed?"
   - Step 2 (Execution): ONLY after the admin confirms (e.g., "Yes", "Proceed", "Go ahead"), call the \`bulk_approve_requests\` tool with the IDs of those requests. If the admin only asked for standard ones, include only standard IDs; if they asked for all, include every pending ID.
5. Keep your tone professional, concise, and helpful.

FORMAT RULES FOR SUMMARIES:
- Group requests into two sections: "**Standard**" and "**Out of Scope**" (both are approvable).
- Use this format for each entry:
  • Employee Name (Role) → Resource Name

- Deduplicate and show count if same person has multiple requests for the same resource (e.g., "• Joe Daniel (UI Engineer) → AWS Console (2 requests)")
- End with a summary line like: "**Summary: N standard · N out-of-scope · N total**"
- Add an empty line between the two groups.
- NEVER use tables. NEVER use pipes or dashes to create table-like formatting.`;

  type OAIMessage = { role: string; content: string | null; tool_calls?: any[]; tool_call_id?: string; name?: string };
  const baseMessages: OAIMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: any) => ({ role: m.role, content: m.content })),
  ];

  const candidates = getSortedProviderCandidates();
  if (candidates.length === 0) {
    return NextResponse.json({
      message: "I'm having trouble connecting right now. Please try again in a moment.",
      toolCalls: [],
    });
  }

  for (const candidate of candidates) {
    const executedToolCalls: Array<any> = [];
    const oaiMessages: OAIMessage[] = [...baseMessages];
    let providerFailed = false;

    for (let step = 0; step < 5; step++) {
      let res: Response;
      try {
        res = await fetch(`${candidate.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${candidate.apiKey}`,
          },
          body: JSON.stringify({
            model: candidate.model,
            messages: oaiMessages,
            tools: TOOLS,
            tool_choice: "auto",
            max_tokens: 1000,
          }),
          signal: AbortSignal.timeout(30_000),
        });
      } catch (err) {
        markProviderFailure(candidate.id, err);
        providerFailed = true;
        break;
      }

      if (!res.ok) {
        const errText = await res.text();
        const err = new Error(errText);
        markProviderFailure(candidate.id, err);
        providerFailed = true;
        break;
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const assistantMsg = choice?.message;

      if (!assistantMsg) {
        providerFailed = true;
        markProviderFailure(candidate.id, new Error("Empty response from provider"));
        break;
      }

      oaiMessages.push(assistantMsg);

      if (!assistantMsg.tool_calls?.length) {
        markProviderSuccess(candidate.id);
        return NextResponse.json({
          message: assistantMsg.content ?? "",
          toolCalls: executedToolCalls,
        });
      }

      const toolResultMessages: OAIMessage[] = [];
      for (const tc of assistantMsg.tool_calls) {
        const args = JSON.parse(tc.function.arguments ?? "{}");
        let result: Record<string, unknown>;

        if (tc.function.name === "bulk_approve_requests") {
          result = await executeBulkApprove(args.request_ids, admin_id);
        } else {
          result = { error: "Unknown tool" };
        }

        executedToolCalls.push({ name: tc.function.name, args, result });
        toolResultMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      oaiMessages.push(...toolResultMessages);
    }

    if (!providerFailed) {
      markProviderSuccess(candidate.id);
      return NextResponse.json({
        message: "Done — the standard requests have been approved.",
        toolCalls: executedToolCalls,
      });
    }
  }

  return NextResponse.json({
    message: "I'm unable to connect right now. Please try again in a moment.",
    toolCalls: [],
  });
}
