import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { full_name, email, role_id, org_id, is_admin = false } = await request.json();

  if (!full_name || !email || !role_id || !org_id) {
    return NextResponse.json(
      { error: "full_name, email, role_id, and org_id are required" },
      { status: 400 }
    );
  }

  // Check for duplicate email within org
  const { data: existing } = await supabaseServer
    .from("employees")
    .select("id")
    .ilike("email", email.trim())
    .eq("org_id", org_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "An employee with this email already exists in your organisation" },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseServer
    .from("employees")
    .insert({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role_id,
      org_id,
      is_admin,
      status: "invited",
    })
    .select("id, full_name, email, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, employee: data }, { status: 201 });
}
