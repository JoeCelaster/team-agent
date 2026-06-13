import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Demo reset — puts Joe back to starting state for the stage demo.
// DELETE /api/demo-reset  (no body needed)
export async function DELETE() {
  const JOE_EMAIL = "joe@abccorp.com";
  const JOE_EMPLOYEE_ID = "c67c2658-0d8a-4ec8-8543-92abeb2d5f6d";

  // 1. Delete all access_requests created by Joe (except seed)
  //    We keep only the AWS Console off-role one (already in seed).
  //    Easiest: delete all agent-requested rows created today, keep original seeds.
  await supabaseServer
    .from("access_requests")
    .delete()
    .eq("employee_id", JOE_EMPLOYEE_ID)
    .eq("requested_by", "agent")
    .neq("resource_id", (
      await supabaseServer
        .from("resources")
        .select("id")
        .ilike("name", "AWS Console")
        .single()
    ).data?.id ?? "");

  // 2. Reset employee_access: keep GitHub Org + Figma as granted,
  //    Claude as pending (seed state), delete everything else Joe requested.
  const { data: seedResources } = await supabaseServer
    .from("resources")
    .select("id, name")
    .in("name", ["GitHub Org", "Figma", "Claude AI"]);

  const seedIds = seedResources?.map((r) => r.id) ?? [];

  // Delete non-seed access rows for Joe
  if (seedIds.length > 0) {
    await supabaseServer
      .from("employee_access")
      .delete()
      .eq("employee_id", JOE_EMPLOYEE_ID)
      .not("resource_id", "in", `(${seedIds.join(",")})`);
  }

  // Reset seed rows to correct statuses
  for (const r of seedResources ?? []) {
    const targetStatus =
      r.name === "GitHub Org" || r.name === "Figma" ? "granted" : "pending";
    await supabaseServer
      .from("employee_access")
      .update({
        status: targetStatus,
        granted_at: targetStatus === "granted" ? new Date().toISOString() : null,
        denied_at: null,
        requested_at: new Date().toISOString(),
      })
      .eq("employee_id", JOE_EMPLOYEE_ID)
      .eq("resource_id", r.id);
  }

  // 3. Flip Joe back to active (in case anything changed)
  await supabaseServer
    .from("employees")
    .update({ status: "active" })
    .ilike("email", JOE_EMAIL);

  return NextResponse.json({ success: true, message: "Demo state reset for joe@abccorp.com" });
}
