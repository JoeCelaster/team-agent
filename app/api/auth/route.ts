import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("employees")
    .select("id, full_name, email, is_admin, status, org_id, role_id, roles(name, color_hex), organizations(name, email_domain)")
    .ilike("email", email.trim())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Email not registered with any organisation" }, { status: 404 });
  }

  // Q1b — flip invited → active on first login
  if (data.status === "invited") {
    await supabaseServer
      .from("employees")
      .update({ status: "active" })
      .eq("id", data.id);
  }

  const role = (data.roles as unknown) as { name: string; color_hex: string } | null;
  const org = (data.organizations as unknown) as { name: string; email_domain: string } | null;

  return NextResponse.json({
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    is_admin: data.is_admin,
    status: data.status === "invited" ? "active" : data.status,
    org_id: data.org_id,
    role_id: data.role_id ?? "",
    role_name: role?.name ?? "",
    color_hex: role?.color_hex ?? "#6366f1",
    org_name: org?.name ?? "",
    email_domain: org?.email_domain ?? "",
  });
}
