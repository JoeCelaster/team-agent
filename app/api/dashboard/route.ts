import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { AccessRow } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employee_id");
  if (!employeeId) return NextResponse.json({ error: "employee_id required" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("employee_access_view")
    .select("*")
    .eq("employee_id", employeeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sortOrder: Record<string, number> = { mandatory: 1, common: 2, optional: 3 };
  const sorted = (data as AccessRow[]).sort(
    (a, b) =>
      (sortOrder[a.access_type] ?? 9) - (sortOrder[b.access_type] ?? 9) ||
      a.resource_name.localeCompare(b.resource_name)
  );

  return NextResponse.json(sorted);
}
