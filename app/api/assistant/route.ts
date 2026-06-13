import { NextResponse } from "next/server";
import { getSortedProviderCandidates } from "@/lib/ai/provider-pool";
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
  isRoleRelevant: boolean,
  employeeId: string,
  orgId: string
): Promise<Record<string, unknown>> {
  const { data: resource } = await supabaseServer
    .from("resources")
    .select("id")
    .ilike("name", resourceName)
    .eq("org_id", orgId)
    .single();

  if (!resource) return { success: false, error: `Tool "${resourceName}" not found.` };

  const { data: existing } = await supabaseServer
    .from("employee_access")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("resource_id", resource.id)
    .single();

  if (existing) {
    await supabaseServer
      .from("employee_access")
      .update({ status: "pending", requested_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabaseServer.from("employee_access").insert({
      employee_id: employeeId,
      resource_id: resource.id,
      status: "pending",
      requested_at: new Date().toISOString(),
    });
  }

  await supabaseServer.from("access_requests").insert({
    employee_id: employeeId,
    resource_id: resource.id,
    requested_by: "agent",
    is_role_relevant: isRoleRelevant,
    employee_note: employeeNote,
    status: "pending",
  });

  return { success: true, status: "pending", resource_name: resourceName };
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
3. If a resource is NOT in their role, warn them it will be flagged for manager review, but still offer to request it.
4. For "how long" questions, calculate from requested_at to today and subtract from avg_provisioning_days.
5. Never make up information not in the data above.
6. Keep responses short and action-oriented.`;

  // Get best available provider from the pool
  const candidates = getSortedProviderCandidates();
  if (candidates.length === 0) {
    const toolNames = accessList
      .filter((r) => r.access_type === "mandatory")
      .map((r) => r.resource_name)
      .join(", ");
    return NextResponse.json({
      message: `I'm having trouble connecting right now. Your mandatory tools are: ${toolNames || "none listed"}. Try again in a moment.`,
      toolCalls: [],
    });
  }

  const provider = candidates[0];

  // Build OpenAI-compatible messages
  type OAIMessage = { role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string };
  const oaiMessages: OAIMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
  ];

  const executedToolCalls: Array<{ name: string; args: Record<string, unknown>; result: Record<string, unknown> }> = [];

  // Tool call loop (max 5 rounds)
  for (let step = 0; step < 5; step++) {
    let res: Response;
    try {
      res = await fetch(`${provider.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: oaiMessages,
          tools: TOOLS,
          tool_choice: "auto",
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      const toolNames = accessList
        .filter((r) => r.access_type === "mandatory")
        .map((r) => r.resource_name)
        .join(", ");
      return NextResponse.json({
        message: `Connection issue. Your mandatory tools are: ${toolNames || "none listed"}. Please try again.`,
        toolCalls: [],
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ message: `AI provider error: ${errText.slice(0, 100)}`, toolCalls: [] });
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const assistantMsg = choice?.message;

    if (!assistantMsg) break;

    oaiMessages.push(assistantMsg);

    // No tool calls — we have the final text
    if (!assistantMsg.tool_calls?.length) {
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
          args.is_role_relevant,
          employee_id,
          org_id
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

  return NextResponse.json({
    message: "Done — your requests have been submitted.",
    toolCalls: executedToolCalls,
  });
}
