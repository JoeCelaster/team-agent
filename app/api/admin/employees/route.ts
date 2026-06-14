import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  const status = searchParams.get("status"); // "active" | "invited"

  if (!orgId) return NextResponse.json({ error: "org_id required" }, { status: 400 });

  const { data: employees, error } = await supabaseServer
    .from("employees")
    .select("id, full_name, email, status, is_admin, created_at, roles(name, color_hex)")
    .eq("org_id", orgId)
    .eq("status", status === "active" ? "active" : "invited")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status !== "active") {
    return NextResponse.json(employees ?? []);
  }

  // For active employees, also fetch their granted access
  const employeeIds = (employees ?? []).map((e) => e.id);
  if (employeeIds.length === 0) return NextResponse.json([]);

  const { data: access } = await supabaseServer
    .from("employee_access_view")
    .select("employee_id, resource_name, access_status")
    .in("employee_id", employeeIds)
    .eq("access_status", "granted");

  const accessByEmployee = (access ?? []).reduce<Record<string, string[]>>((acc, row) => {
    if (!acc[row.employee_id]) acc[row.employee_id] = [];
    acc[row.employee_id].push(row.resource_name);
    return acc;
  }, {});

  const result = (employees ?? []).map((emp) => ({
    ...emp,
    granted_tools: accessByEmployee[emp.id] ?? [],
  }));

  return NextResponse.json(result);
}
