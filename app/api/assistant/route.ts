import { NextResponse } from "next/server";
import { getSortedProviderCandidates, markProviderFailure, markProviderSuccess, isRateLimitError } from "@/lib/ai/provider-pool";
import { supabaseServer } from "@/lib/supabase/server";
import type { AccessRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OpenAI-compatible tool schemas (works with Groq, SambaNova, etc.)
const TOOLS = [
  {
    type: "function",
    function: {
      name: "validate_role",
      description: "Check if a resource/tool is mapped to the employee's role before requesting it.",
      parameters: {
        type: "object",
        properties: {
          resource_name: { type: "string", description: "Exact name of the tool or resource" },
        },
        required: ["resource_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_access",
      description:
        "Request access to a tool on behalf of the employee. Creates a pending row in the DB and notifies the admin queue.",
      parameters: {
        type: "object",
        properties: {
          resource_name: { type: "string", description: "Exact name of the tool to request" },
          employee_note: { type: "string", description: "Reason for the request, in the employee's words" },
          is_role_relevant: {
            type: "boolean",
            description: "Whether this tool is mapped to the employee's role",
          },
        },
        required: ["resource_name", "employee_note", "is_role_relevant"],
      },
    },
  },
];

async function executeValidateRole(
  resourceName: string,
  roleId: string,
  roleName: string
): Promise<Record<string, unknown>> {
  const { data } = await supabaseServer
    .from("resources")
    .select("id, name, role_resources!inner(role_id)")
    .ilike("name", resourceName)
    .eq("role_resources.role_id", roleId)
    .limit(1);

  return { is_relevant: (data?.length ?? 0) > 0, role_name: roleName };
}

async function executeRequestAccess(
  resourceName: string,
  employeeNote: string,
  employeeId: string,
  orgId: string,
  roleId: string
): Promise<Record<string, unknown>> {
  const { data: resource } = await supabaseServer
    .from("resources")
    .select("id")
    .ilike("name", resourceName)
    .eq("org_id", orgId)
    .single();

  if (!resource) return { success: false, error: `Tool "${resourceName}" not found.` };

  // Server-side role check — do not trust the model-supplied is_role_relevant boolean
  const { data: roleMapping } = await supabaseServer
    .from("role_resources")
    .select("role_id")
    .eq("resource_id", resource.id)
    .eq("role_id", roleId)
    .single();

  const autoApprove = !!roleMapping;
  const now = new Date().toISOString();

  const { data: existing } = await supabaseServer
    .from("employee_access")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("resource_id", resource.id)
    .single();

  if (existing) {
    await supabaseServer
      .from("employee_access")
      .update(autoApprove
        ? { status: "granted", granted_at: now }
        : { status: "pending", requested_at: now })
      .eq("id", existing.id);
  } else {
    await supabaseServer.from("employee_access").insert(autoApprove
      ? { employee_id: employeeId, resource_id: resource.id, status: "granted", granted_at: now }
      : { employee_id: employeeId, resource_id: resource.id, status: "pending", requested_at: now });
  }

  await supabaseServer.from("access_requests").insert({
    employee_id: employeeId,
    resource_id: resource.id,
    requested_by: "agent",
    is_role_relevant: autoApprove,
    employee_note: employeeNote,
    status: autoApprove ? "approved" : "pending",
    ...(autoApprove ? { reviewed_at: now, admin_note: "Auto-approved — tool mapped to employee role" } : {}),
  });

  return { success: true, status: autoApprove ? "granted" : "pending", auto_approved: autoApprove, resource_name: resourceName };
}

export async function POST(request: Request) {
  const { messages, employee_id, role_id, org_id } = await request.json();

  if (!employee_id || !role_id) {
    return NextResponse.json({ error: "employee_id and role_id required" }, { status: 400 });
  }

  // Build system prompt from live DB context
  const [empResult, accessResult] = await Promise.all([
    supabaseServer
      .from("employees")
      .select("full_name, email, roles(name), organizations(name)")
      .eq("id", employee_id)
      .single(),
    supabaseServer
      .from("employee_access_view")
      .select(
        "resource_name, access_type, access_status, avg_provisioning_days, escalation_contact, requested_at"
      )
      .eq("employee_id", employee_id),
  ]);

  const emp = empResult.data as { full_name: string; email: string; roles: unknown; organizations: unknown } | null;
  const roleName = (emp?.roles as { name?: string } | null)?.name ?? "";
  const orgName = (emp?.organizations as { name?: string } | null)?.name ?? "";
  const accessList = (accessResult.data as AccessRow[]) ?? [];

  const accessJson = JSON.stringify(
    accessList.map((r) => ({
      tool: r.resource_name,
      type: r.access_type,
      status: r.access_status,
      avg_days: r.avg_provisioning_days,
      escalation: r.escalation_contact,
      requested_at: r.requested_at,
    }))
  );

  const systemPrompt = `You are an onboarding assistant for ${orgName}.
You help new employees understand their role, track their tool access, and request access on their behalf.

Employee: ${emp?.full_name ?? "Unknown"} | Role: ${roleName} | Email: ${emp?.email ?? ""}

Their access status:
${accessJson}

Rules:
1. Be specific — use real tool names, provisioning times, and escalation contacts from the data above.
2. Before requesting any access, call validate_role first.
3. If a resource IS mapped to their role, it will be granted immediately — confirm to them that access is now active. If it is NOT in their role, warn them it will go to manager review, but still offer to submit it.
4. For "how long" questions, calculate from requested_at to today and subtract from avg_provisioning_days.
5. Never make up information not in the data above.
6. Keep responses short and action-oriented.`;

  // Build OpenAI-compatible messages once — reused across provider attempts
  type OAIMessage = { role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string };
  const baseMessages: OAIMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
  ];

  const mandatoryToolNames = accessList
    .filter((r) => r.access_type === "mandatory")
    .map((r) => r.resource_name)
    .join(", ");

  const candidates = getSortedProviderCandidates();
  if (candidates.length === 0) {
    return NextResponse.json({
      message: `I'm having trouble connecting right now. Your mandatory tools are: ${mandatoryToolNames || "none listed"}. Try again in a moment.`,
      toolCalls: [],
    });
  }

  // Try each provider in priority order; on failure mark it and move to the next
  for (const candidate of candidates) {
    const executedToolCalls: Array<{ name: string; args: Record<string, unknown>; result: Record<string, unknown> }> = [];
    const oaiMessages: OAIMessage[] = [...baseMessages];
    let providerFailed = false;

    // Tool call loop (max 5 rounds) for this provider
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
        // Rate-limit errors shouldn't fall through to the next provider immediately —
        // markProviderFailure already puts it in cooldown, so just try the next one.
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

      // No tool calls — final text response
      if (!assistantMsg.tool_calls?.length) {
        markProviderSuccess(candidate.id);
        return NextResponse.json({
          message: assistantMsg.content ?? "",
          toolCalls: executedToolCalls,
        });
      }

      // Execute tool calls
      const toolResultMessages: OAIMessage[] = [];
      for (const tc of assistantMsg.tool_calls) {
        const args = JSON.parse(tc.function.arguments ?? "{}");
        let result: Record<string, unknown>;

        if (tc.function.name === "validate_role") {
          result = await executeValidateRole(args.resource_name, role_id, roleName);
        } else if (tc.function.name === "request_access") {
          result = await executeRequestAccess(
            args.resource_name,
            args.employee_note,
            employee_id,
            org_id,
            role_id
          );
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
      // Reached max tool-call rounds without a final text — treat as success with fallback message
      markProviderSuccess(candidate.id);
      return NextResponse.json({
        message: "Done — your requests have been submitted.",
        toolCalls: executedToolCalls,
      });
    }
    // providerFailed = true → continue to next candidate
  }

  // All providers exhausted
  return NextResponse.json({
    message: `I'm unable to connect right now. Your mandatory tools are: ${mandatoryToolNames || "none listed"}. Please try again in a moment.`,
    toolCalls: [],
  });
}
