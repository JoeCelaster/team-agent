import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { request_id, admin_note = null, reviewer_id } = await request.json();
  if (!request_id || !reviewer_id) {
    return NextResponse.json({ error: "request_id and reviewer_id required" }, { status: 400 });
  }

  const { data: req } = await supabaseServer
    .from("access_requests")
    .select("employee_id, resource_id")
    .eq("id", request_id)
    .single();

  if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  await supabaseServer
    .from("access_requests")
    .update({ status: "denied", admin_note, reviewed_at: new Date().toISOString(), reviewed_by_id: reviewer_id })
    .eq("id", request_id);

  await supabaseServer
    .from("employee_access")
    .update({ status: "denied", denied_at: new Date().toISOString() })
    .eq("employee_id", req.employee_id)
    .eq("resource_id", req.resource_id);

  return NextResponse.json({ success: true });
}
