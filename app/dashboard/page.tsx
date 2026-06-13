"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, CheckCircle2, Loader2, Map, ChevronLeft, ChevronRight,
  LayoutGrid, Shield, Users, Sparkles, Circle, Clock, XCircle,
  MessageSquare, X,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AccessCard } from "./components/AccessCard";
import { SupportBot } from "./components/SupportBot";
import { RoadmapPanel } from "./components/RoadmapPanel";
import type { Session, AccessRow, AccessStatus } from "@/lib/types";

type CategoryFilter = "all" | "mandatory" | "common" | "optional";
type StatusFilter = "all" | AccessStatus;

const CATEGORY_OPTS: Array<{
  value: CategoryFilter;
  label: string;
  Icon: React.ElementType;
  inactiveIcon: string;
  activeClass: string;
  activeDot: string;
}> = [
  { value: "all",       label: "All tools",  Icon: LayoutGrid, inactiveIcon: "text-zinc-600", activeClass: "text-indigo-300 bg-indigo-500/12 border-indigo-500/25", activeDot: "bg-indigo-400" },
  { value: "mandatory", label: "Mandatory",  Icon: Shield,     inactiveIcon: "text-zinc-600", activeClass: "text-red-300 bg-red-500/10 border-red-500/20",          activeDot: "bg-red-400"    },
  { value: "common",    label: "Common",     Icon: Users,      inactiveIcon: "text-zinc-600", activeClass: "text-zinc-200 bg-zinc-700/50 border-zinc-600/40",        activeDot: "bg-zinc-400"   },
  { value: "optional",  label: "Optional",   Icon: Sparkles,   inactiveIcon: "text-zinc-600", activeClass: "text-blue-300 bg-blue-500/10 border-blue-500/20",        activeDot: "bg-blue-400"   },
];

const STATUS_OPTS: Array<{
  value: StatusFilter;
  label: string;
  Icon: React.ElementType;
  activeClass: string;
}> = [
  { value: "all",           label: "All",          Icon: Circle,       activeClass: "text-indigo-300 bg-indigo-500/12 border-indigo-500/25" },
  { value: "granted",       label: "Granted",      Icon: CheckCircle2, activeClass: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  { value: "pending",       label: "Pending",      Icon: Clock,        activeClass: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  { value: "not_requested", label: "Not requested", Icon: Circle,      activeClass: "text-zinc-300 bg-zinc-800 border-zinc-700" },
  { value: "denied",        label: "Denied",       Icon: XCircle,      activeClass: "text-red-300 bg-red-500/10 border-red-500/20" },
];

export default function EmployeeDashboard() {
  const router = useRouter();
  const [session, setSession]               = useState<Session | null>(null);
  const [rows, setRows]                     = useState<AccessRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [showRoadmap, setShowRoadmap]       = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [botOpen, setBotOpen]               = useState(true);
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>("all");
  const [filterStatus, setFilterStatus]     = useState<StatusFilter>("all");

  useEffect(() => {
    const raw = localStorage.getItem("onboard-session");
    if (!raw) { router.replace("/login"); return; }
    const s = JSON.parse(raw) as Session;
    if (s.is_admin) { router.replace("/admin"); return; }
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

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("access-updates")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "employee_access",
        filter: `employee_id=eq.${session.id}`,
      }, () => fetchDashboard(session.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, fetchDashboard]);

  if (!session || loading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const mandatory = rows.filter((r) => r.access_type === "mandatory");
  const common    = rows.filter((r) => r.access_type === "common");
  const optional  = rows.filter((r) => r.access_type === "optional");
  const grantedCount  = mandatory.filter((r) => r.access_status === "granted").length;
  const mandatoryPct  = mandatory.length > 0 ? (grantedCount / mandatory.length) * 100 : 0;
  const allDone       = grantedCount === mandatory.length && mandatory.length > 0;

  const categoryCounts: Record<CategoryFilter, number> = {
    all:       rows.length,
    mandatory: mandatory.length,
    common:    common.length,
    optional:  optional.length,
  };

  const filteredRows = rows.filter((r) => {
    const catOk = filterCategory === "all" || r.access_type === filterCategory;
    const stOk  = filterStatus === "all" || r.access_status === filterStatus;
    return catOk && stOk;
  });

  const isFiltered  = filterCategory !== "all" || filterStatus !== "all";
  const onRequested = () => fetchDashboard(session.id);

  const SECTIONS = [
    { key: "mandatory", label: "Mandatory", accent: "text-red-400",  sub: `${mandatory.length} tools required for your role`, items: mandatory },
    { key: "common",    label: "Common",    accent: "text-zinc-400", sub: `Available to everyone in ${session.org_name}`,       items: common    },
    { key: "optional",  label: "Optional",  accent: "text-blue-400", sub: "Request if needed for your work",                    items: optional  },
  ];

  return (
    <div className="h-screen bg-[var(--canvas)] text-zinc-100 font-sans flex flex-col overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 z-40 border-b border-zinc-800/80 bg-[var(--canvas)]/90 backdrop-blur-md px-5 h-[52px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px] shrink-0"
            style={{ background: session.color_hex }}
          >
            {session.full_name[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-zinc-100 truncate">{session.full_name}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0"
                style={{ background: session.color_hex + "20", color: session.color_hex }}
              >
                {session.role_name}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate">{session.email} · {session.org_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Bot toggle when bot is closed */}
          {!botOpen && (
            <button
              onClick={() => setBotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Assistant
            </button>
          )}
          <button
            onClick={() => { localStorage.removeItem("onboard-session"); router.push("/login"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT SIDEBAR ───────────────────────────────────────────── */}
        <aside
          className="shrink-0 border-r border-zinc-800/70 flex flex-col overflow-hidden"
          style={{
            width: sidebarOpen ? 220 : 52,
            transition: "width 260ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {/* Sidebar header */}
          <div className={`h-[48px] border-b border-zinc-800/60 flex items-center shrink-0 ${sidebarOpen ? "px-4 justify-between" : "justify-center"}`}>
            {sidebarOpen && (
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Filters</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all shrink-0"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen
                ? <ChevronLeft className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sidebar body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-6 py-5">

            {/* ── Progress ── */}
            <div className={sidebarOpen ? "px-4" : "px-2"}>
              {sidebarOpen ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mandatory</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-zinc-400">{grantedCount} / {mandatory.length} granted</span>
                      <span className="text-[11px] font-semibold text-zinc-300">{Math.round(mandatoryPct)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${allDone ? "bg-emerald-500" : "bg-indigo-500"}`}
                        style={{ width: `${mandatoryPct}%`, transition: "width 700ms cubic-bezier(0.25, 1, 0.5, 1)" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Collapsed: mini SVG ring */
                <div className="flex justify-center" title={`${Math.round(mandatoryPct)}% mandatory complete`}>
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.26 0.008 275)" strokeWidth="3.5" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={allDone ? "oklch(0.7 0.15 160)" : "oklch(0.62 0.19 277)"}
                      strokeWidth="3.5"
                      strokeDasharray={`${(mandatoryPct / 100) * 87.96} 87.96`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* ── Roadmap CTA ── */}
            <div className={sidebarOpen ? "px-4" : "px-2"}>
              <button
                onClick={() => setShowRoadmap(true)}
                title="View onboarding roadmap"
                className={`w-full flex items-center rounded-xl border border-indigo-500/20 bg-indigo-600/8 hover:bg-indigo-600/16 text-indigo-400 transition-all duration-200 ease-out
                  ${sidebarOpen ? "gap-2.5 px-3 py-2.5" : "justify-center p-2.5"}`}
              >
                <Map className="w-3.5 h-3.5 shrink-0" />
                {sidebarOpen && <span className="text-[11px] font-medium">View roadmap</span>}
              </button>
            </div>

            {/* Divider */}
            <div className={`border-t border-zinc-800/60 ${sidebarOpen ? "mx-4" : "mx-2"}`} />

            {/* ── Category filter ── */}
            <div className={sidebarOpen ? "px-3" : "px-1.5"}>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Category</p>
              )}
              <div className="space-y-0.5">
                {CATEGORY_OPTS.map(({ value, label, Icon, activeClass }) => {
                  const active = filterCategory === value;
                  const count  = categoryCounts[value];
                  return (
                    <button
                      key={value}
                      onClick={() => setFilterCategory(value)}
                      title={sidebarOpen ? undefined : label}
                      className={`w-full flex items-center rounded-xl border text-[11px] font-medium transition-all duration-150 ease-out
                        ${sidebarOpen ? "gap-2.5 px-2.5 py-2" : "justify-center p-2.5"}
                        ${active
                          ? activeClass
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-transparent"
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left">{label}</span>
                          <span className={`text-[10px] tabular-nums font-semibold ${active ? "opacity-80" : "text-zinc-600"}`}>
                            {count}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Status filter ── */}
            <div className={sidebarOpen ? "px-3" : "px-1.5"}>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Status</p>
              )}
              <div className="space-y-0.5">
                {STATUS_OPTS.map(({ value, label, Icon, activeClass }) => {
                  const count  = value === "all" ? rows.length : rows.filter((r) => r.access_status === value).length;
                  if (value !== "all" && count === 0) return null;
                  const active = filterStatus === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setFilterStatus(value)}
                      title={sidebarOpen ? undefined : label}
                      className={`w-full flex items-center rounded-xl border text-[11px] font-medium transition-all duration-150 ease-out
                        ${sidebarOpen ? "gap-2.5 px-2.5 py-2" : "justify-center p-2.5"}
                        ${active
                          ? activeClass
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-transparent"
                        }`}
                    >
                      {/* Radio indicator dot */}
                      <span className={`w-3.5 h-3.5 shrink-0 rounded-full border flex items-center justify-center transition-all
                        ${active ? "border-current" : "border-zinc-700"}`}>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </span>
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left capitalize">{label}</span>
                          <span className={`text-[10px] tabular-nums font-semibold ${active ? "opacity-80" : "text-zinc-600"}`}>
                            {count}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-6 space-y-7 animate-fade-in max-w-5xl">

            {/* Welcome banner */}
            <div className="rounded-2xl border border-zinc-800/60 bg-[var(--surface)] px-6 py-5 flex items-center gap-5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Welcome aboard</p>
                <h1 className="text-[17px] font-bold text-zinc-50 leading-snug">
                  Hi {session.full_name.split(" ")[0]}, you&apos;re a {session.role_name}
                </h1>
                <p className="text-[13px] text-zinc-500 mt-1 leading-relaxed">
                  {allDone
                    ? "All mandatory tools are ready. You're set up and good to go."
                    : `${mandatory.length - grantedCount} mandatory tool${mandatory.length - grantedCount !== 1 ? "s" : ""} still need access. Use the bot or request below.`}
                </p>
              </div>
              {allDone ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-zinc-100 tabular-nums leading-none">{Math.round(mandatoryPct)}%</p>
                  <p className="text-[10px] text-zinc-500 mt-1">setup complete</p>
                </div>
              )}
            </div>

            {/* Active filter pill + clear */}
            {isFiltered && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-zinc-500">Showing</span>
                {filterCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-300 capitalize">
                    {filterCategory}
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-300">
                    {filterStatus.replace("_", " ")}
                  </span>
                )}
                <span className="text-[11px] text-zinc-600">· {filteredRows.length} tool{filteredRows.length !== 1 ? "s" : ""}</span>
                <button
                  onClick={() => { setFilterCategory("all"); setFilterStatus("all"); }}
                  className="ml-0.5 inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            )}

            {/* Tool sections */}
            {isFiltered ? (
              filteredRows.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredRows.map((r) => (
                    <AccessCard key={r.resource_id} row={r} session={session} onRequested={onRequested} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
                  <Circle className="w-8 h-8 stroke-[1.5]" />
                  <p className="text-sm">No tools match this filter.</p>
                </div>
              )
            ) : (
              <>
                {SECTIONS.map(({ key, label, accent, sub, items }) =>
                  items.length > 0 ? (
                    <section key={key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h2 className={`text-[11px] font-bold uppercase tracking-wider ${accent}`}>{label}</h2>
                        <span className="text-[10px] text-zinc-600">{sub}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((r) => (
                          <AccessCard key={r.resource_id} row={r} session={session} onRequested={onRequested} />
                        ))}
                      </div>
                    </section>
                  ) : null
                )}
                {rows.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
                    <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
                    <p className="text-sm">No resources configured for your role yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── RIGHT PANEL — AI Bot ────────────────────────────────────── */}
        {botOpen && (
          <aside className="shrink-0 border-l border-zinc-800/70 flex flex-col" style={{ width: 300 }}>
            {/* Bot header with close */}
            <div className="h-[48px] border-b border-zinc-800/60 px-4 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Assistant</span>
              <button
                onClick={() => setBotOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all"
                aria-label="Close assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-3">
              <SupportBot session={session} onAccessRequested={onRequested} />
            </div>
          </aside>
        )}
      </div>

      {showRoadmap && (
        <RoadmapPanel session={session} rows={rows} onClose={() => setShowRoadmap(false)} />
      )}
    </div>
  );
}
