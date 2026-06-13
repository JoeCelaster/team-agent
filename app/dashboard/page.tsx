"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle2, Loader2, Map } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AccessCard } from "./components/AccessCard";
import { SupportBot } from "./components/SupportBot";
import { RoadmapPanel } from "./components/RoadmapPanel";
import type { Session, AccessRow } from "@/lib/types";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoadmap, setShowRoadmap] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("onboard-session");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const s = JSON.parse(raw) as Session;
    if (s.is_admin) {
      router.replace("/admin");
      return;
    }
    setSession(s);
  }, [router]);

  const fetchDashboard = useCallback(async (employeeId: string) => {
    const res = await fetch(`/api/dashboard?employee_id=${employeeId}`);
    if (res.ok) setRows(await res.json());
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetchDashboard(session.id).finally(() => setLoading(false));
  }, [session, fetchDashboard]);

  // Supabase Realtime — live pill flip when admin approves/denies
  useEffect(() => {
    if (!session) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("access-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "employee_access",
          filter: `employee_id=eq.${session.id}`,
        },
        () => fetchDashboard(session.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, fetchDashboard]);

  if (!session || loading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const mandatory = rows.filter((r) => r.access_type === "mandatory");
  const common = rows.filter((r) => r.access_type === "common");
  const optional = rows.filter((r) => r.access_type === "optional");
  const grantedCount = mandatory.filter((r) => r.access_status === "granted").length;

  const onRequested = () => fetchDashboard(session.id);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[var(--canvas)]/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
            style={{ background: session.color_hex }}
          >
            {session.full_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-zinc-100">{session.full_name}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                style={{ background: session.color_hex + "33", color: session.color_hex }}
              >
                {session.role_name}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">{session.email} · {session.org_name}</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem("onboard-session"); router.push("/login"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 border-r border-zinc-800/80 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Mandatory Progress</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{grantedCount} of {mandatory.length} granted</span>
                <span>{mandatory.length > 0 ? Math.round((grantedCount / mandatory.length) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${mandatory.length > 0 ? (grantedCount / mandatory.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRoadmap(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-medium transition-all duration-200 ease-out active:scale-[0.99]"
          >
            <Map className="w-3.5 h-3.5" />
            View onboarding roadmap
          </button>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Summary</p>
            {[
              { label: "Mandatory", count: mandatory.length, color: "text-red-400" },
              { label: "Common", count: common.length, color: "text-zinc-400" },
              { label: "Optional", count: optional.length, color: "text-blue-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className={`font-medium ${color}`}>{label}</span>
                <span className="text-zinc-500">{count} tools</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Access Status</p>
            {(["granted", "pending", "not_requested", "denied"] as const).map((s) => {
              const count = rows.filter((r) => r.access_status === s).length;
              if (count === 0) return null;
              return (
                <div key={s} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 capitalize">{s.replace("_", " ")}</span>
                  <span className="text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8 animate-fade-in">
          {/* Welcome banner */}
          <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.04] p-6">
            <p className="text-[11px] font-medium text-indigo-400 uppercase tracking-wide mb-1">Welcome aboard</p>
            <h1 className="text-xl font-semibold text-zinc-50">Hi {session.full_name.split(" ")[0]}, you&apos;re a {session.role_name}</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {grantedCount === mandatory.length && mandatory.length > 0
                ? "All mandatory tools are set up — you're good to go! 🎉"
                : `${mandatory.length - grantedCount} mandatory tool${mandatory.length - grantedCount !== 1 ? "s" : ""} still need access. Use the bot or request below.`}
            </p>
          </div>

          {/* Mandatory */}
          {mandatory.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider">Mandatory</h2>
                <span className="text-[10px] text-zinc-600">{mandatory.length} tools required for your role</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mandatory.map((r) => (
                  <AccessCard key={r.resource_id} row={r} session={session} onRequested={onRequested} />
                ))}
              </div>
            </section>
          )}

          {/* Common */}
          {common.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Common</h2>
                <span className="text-[10px] text-zinc-600">Available to everyone in {session.org_name}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {common.map((r) => (
                  <AccessCard key={r.resource_id} row={r} session={session} onRequested={onRequested} />
                ))}
              </div>
            </section>
          )}

          {/* Optional */}
          {optional.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Optional</h2>
                <span className="text-[10px] text-zinc-600">Request if needed for your work</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {optional.map((r) => (
                  <AccessCard key={r.resource_id} row={r} session={session} onRequested={onRequested} />
                ))}
              </div>
            </section>
          )}

          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 text-sm">
              <CheckCircle2 className="w-10 h-10 mb-3 stroke-[1.5]" />
              No resources configured for your role yet.
            </div>
          )}
        </main>

        {/* Right panel — Support Bot */}
        <aside className="w-80 shrink-0 border-l border-zinc-800 p-4">
          <SupportBot session={session} onAccessRequested={onRequested} />
        </aside>
      </div>

      {/* Roadmap modal */}
      {showRoadmap && (
        <RoadmapPanel
          session={session}
          rows={rows}
          onClose={() => setShowRoadmap(false)}
        />
      )}
    </div>
  );
}
