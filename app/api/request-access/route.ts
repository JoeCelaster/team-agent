import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { employee_id, resource_id, role_id, requested_by = "employee", employee_note = null } =
    await request.json();

  if (!employee_id || !resource_id) {
    return NextResponse.json({ error: "employee_id and resource_id required" }, { status: 400 });
  }

  // Server-side role check — determines whether to auto-grant or queue for review
  const autoApprove = role_id ? await (async () => {
    const { data } = await supabaseServer
      .from("role_resources")
      .select("role_id")
      .eq("resource_id", resource_id)
      .eq("role_id", role_id)
      .single();
    return !!data;
  })() : false;

  const now = new Date().toISOString();

  // Upsert employee_access
  const { data: existing } = await supabaseServer
    .from("employee_access")
    .select("id")
    .eq("employee_id", employee_id)
    .eq("resource_id", resource_id)
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
      ? { employee_id, resource_id, status: "granted", granted_at: now }
      : { employee_id, resource_id, status: "pending", requested_at: now });
  }

  const { error } = await supabaseServer.from("access_requests").insert({
    employee_id,
    resource_id,
    requested_by,
    is_role_relevant: autoApprove,
    employee_note,
    status: autoApprove ? "approved" : "pending",
    ...(autoApprove ? { reviewed_at: now, admin_note: "Auto-approved — tool mapped to employee role" } : {}),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, status: autoApprove ? "granted" : "pending", auto_approved: autoApprove });
}
