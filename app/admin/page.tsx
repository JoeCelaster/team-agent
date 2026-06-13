"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Loader2 } from "lucide-react";
import type { Session, OrgStats } from "@/lib/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("onboard-session");
    if (!raw) { router.replace("/login"); return; }
    const s = JSON.parse(raw) as Session;
    if (!s.is_admin) { router.replace("/dashboard"); return; }
    setSession(s);
  }, [router]);

  const fetchStats = useCallback(async (orgId: string) => {
    const res = await fetch(`/api/admin/stats?org_id=${orgId}`);
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetchStats(session.org_id).finally(() => setLoading(false));
  }, [session, fetchStats]);

  if (!session || loading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const stats_row = [
    { label: "Total employees", value: stats?.total_employees ?? "—", sub: "in your organisation", dot: "bg-zinc-500", accent: "text-zinc-100" },
    { label: "Active", value: stats?.active_count ?? "—", sub: "logged in at least once", dot: "bg-emerald-400", accent: "text-zinc-100" },
    { label: "Pending login", value: stats?.pending_login_count ?? "—", sub: "invite not yet accepted", dot: "bg-amber-400", accent: "text-zinc-100" },
    { label: "Open requests", value: stats?.open_requests ?? "—", sub: "awaiting your review", dot: "bg-red-400", accent: (stats?.open_requests ?? 0) > 0 ? "text-indigo-400" : "text-zinc-100" },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-zinc-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[var(--canvas)]/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-semibold text-white text-xs">
            {session.full_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-zinc-100">{session.full_name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">{session.org_name}</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem("onboard-session"); router.push("/login"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">{session.org_name} · Onboarding dashboard</p>
        </div>

        {/* Quiet stat row, not a card grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 border-y border-zinc-800/70 py-6">
          {stats_row.map(({ label, value, sub, dot, accent }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
              <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${accent}`}>{value}</p>
              <p className="text-[11px] text-zinc-600">{sub}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/admin/queue")}
          className="w-full flex items-center justify-between bg-[var(--surface)] hover:bg-zinc-800/60 border border-zinc-800 hover:border-indigo-500/30 rounded-2xl p-5 transition-all duration-200 ease-out group"
        >
          <div className="text-left">
            <p className="text-sm font-bold text-zinc-200">Approval Queue</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {stats?.open_requests
                ? `${stats.open_requests} request${stats.open_requests !== 1 ? "s" : ""} waiting for your review`
                : "No pending requests"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(stats?.open_requests ?? 0) > 0 && (
              <span className="w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {stats!.open_requests}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </div>
        </button>
      </main>
    </div>
  );
}
