import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { employee_id, resource_id, requested_by = "employee", is_role_relevant = true, employee_note = null } =
    await request.json();

  if (!employee_id || !resource_id) {
    return NextResponse.json({ error: "employee_id and resource_id required" }, { status: 400 });
  }

  // Step A — upsert employee_access (avoid ON CONFLICT to skip constraint requirement)
  const { data: existing } = await supabaseServer
    .from("employee_access")
    .select("id")
    .eq("employee_id", employee_id)
    .eq("resource_id", resource_id)
    .single();

  if (existing) {
    await supabaseServer
      .from("employee_access")
      .update({ status: "pending", requested_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabaseServer.from("employee_access").insert({
      employee_id,
      resource_id,
      status: "pending",
      requested_at: new Date().toISOString(),
    });
  }

  // Step B — insert access_requests for admin queue
  const { error } = await supabaseServer.from("access_requests").insert({
    employee_id,
    resource_id,
    requested_by,
    is_role_relevant,
    employee_note,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, status: "pending" });
}
