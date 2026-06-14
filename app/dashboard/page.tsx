"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, CheckCircle2, Map, ChevronLeft, ChevronRight,
  LayoutGrid, Shield, Users, Sparkles, Circle,
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
  activeClass: string;
}> = [
  { value: "all",       label: "All tools",  Icon: LayoutGrid, activeClass: "text-accent bg-accent/10 border-accent/25" },
  { value: "mandatory", label: "Mandatory",  Icon: Shield,     activeClass: "text-red-300 bg-red-500/10 border-red-500/20" },
  { value: "common",    label: "Common",     Icon: Users,      activeClass: "text-foreground bg-surface-2 border-border-strong" },
  { value: "optional",  label: "Optional",   Icon: Sparkles,   activeClass: "text-blue-300 bg-blue-500/10 border-blue-500/20" },
];

const STATUS_OPTS: Array<{
  value: StatusFilter;
  label: string;
  activeClass: string;
}> = [
  { value: "all",           label: "All",           activeClass: "text-accent bg-accent/10 border-accent/25" },
  { value: "granted",       label: "Granted",       activeClass: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  { value: "pending",       label: "Pending",       activeClass: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  { value: "not_requested", label: "Not requested", activeClass: "text-foreground bg-surface-2 border-border-strong" },
  { value: "denied",        label: "Denied",        activeClass: "text-red-300 bg-red-500/10 border-red-500/20" },
];

function DashboardSkeleton() {
  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <div className="h-14 shrink-0 border-b border-border" />
      <div className="flex-1 flex">
        <div className="w-[220px] shrink-0 border-r border-border" />
        <div className="flex-1 p-6 space-y-8">
          <div className="space-y-3">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-7 w-72 rounded" />
            <div className="skeleton h-4 w-96 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [session, setSession]               = useState<Session | null>(null);
  const [rows, setRows]                     = useState<AccessRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [showRoadmap, setShowRoadmap]       = useState(false);
  const [sidebarWidth, setSidebarWidth]     = useState(220);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [botWidth, setBotWidth]             = useState(320);
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
        event: "*", schema: "public",
        table: "employee_access",
        filter: `employee_id=eq.${session.id}`,
      }, () => fetchDashboard(session.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, fetchDashboard]);

  // Fallback sync (in case Realtime replication isn't enabled / cross-window):
  // refetch when the tab regains focus, and poll while anything is still pending.
  const hasPending = rows.some((r) => r.access_status === "pending");
  useEffect(() => {
    if (!session) return;
    const refetch = () => fetchDashboard(session.id);

    const onVisible = () => { if (document.visibilityState === "visible") refetch(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refetch);

    const interval = hasPending ? setInterval(refetch, 6000) : null;

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refetch);
      if (interval) clearInterval(interval);
    };
  }, [session, fetchDashboard, hasPending]);

  if (!session || loading) return <DashboardSkeleton />;

  const sidebarOpen = sidebarWidth > 100;

  const handleSidebarDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      setSidebarWidth(Math.max(56, Math.min(360, ev.clientX)));
    };
    const onUp = () => {
      setIsDraggingSidebar(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setSidebarWidth((prev) => (prev < 100 ? 56 : prev));
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleBotDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = botWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      setBotWidth(Math.max(260, Math.min(560, startWidth + (startX - ev.clientX))));
    };
    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

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
    { key: "mandatory", label: "Mandatory", dot: "bg-red-400",     sub: `${mandatory.length} required for your role`,  items: mandatory },
    { key: "common",    label: "Common",    dot: "bg-faint",       sub: `Available to everyone at ${session.org_name}`, items: common    },
    { key: "optional",  label: "Optional",  dot: "bg-blue-400",    sub: "Request if your work needs it",                items: optional  },
  ];

  return (
    <div className="h-screen bg-canvas text-foreground font-sans flex flex-col overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 z-40 h-14 flex items-center justify-between gap-4 border-b border-border bg-canvas/90 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
            style={{ background: session.color_hex }}
          >
            {session.full_name[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{session.full_name}</span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-2xs font-semibold"
                style={{ background: session.color_hex + "22", color: session.color_hex }}
              >
                {session.role_name}
              </span>
            </div>
            <p className="truncate text-xs text-subtle">{session.email} · {session.org_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!botOpen && (
            <button
              onClick={() => setBotOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              AI Assistant
            </button>
          )}
          <button
            onClick={() => { localStorage.removeItem("onboard-session"); router.push("/login"); }}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT SIDEBAR ───────────────────────────────────────────── */}
        <aside
          className="relative shrink-0 border-r border-border flex flex-col overflow-hidden"
          style={{
            width: sidebarWidth,
            transition: isDraggingSidebar ? "none" : "width 260ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {/* Drag handle — right edge */}
          <div
            onMouseDown={handleSidebarDragStart}
            className="absolute inset-y-0 -right-2 z-10 w-4 cursor-col-resize flex items-center justify-center group"
          >
            <div className="w-1 h-8 bg-border group-hover:bg-accent transition-colors duration-150 rounded-full" />
          </div>

          <div className={`flex h-12 shrink-0 items-center border-b border-border ${sidebarOpen ? "px-4 justify-between" : "justify-center"}`}>
            {sidebarOpen && <span className="text-2xs font-semibold uppercase tracking-widest text-faint">Filters</span>}
            <button
              onClick={() => setSidebarWidth(sidebarOpen ? 56 : 220)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-foreground"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-6 py-5">

            {/* Progress */}
            <div className={sidebarOpen ? "px-4" : "px-2"}>
              {sidebarOpen ? (
                <div className="space-y-2">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-faint">Mandatory</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted"><span className="font-data">{grantedCount}/{mandatory.length}</span> granted</span>
                      <span className="font-data text-xs font-semibold text-foreground">{Math.round(mandatoryPct)}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${allDone ? "bg-emerald-500" : "bg-accent"}`}
                        style={{ width: `${mandatoryPct}%`, transition: "width 700ms cubic-bezier(0.25, 1, 0.5, 1)" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center" title={`${Math.round(mandatoryPct)}% mandatory complete`}>
                  <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.26 0.008 277)" strokeWidth="3.5" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={allDone ? "oklch(0.74 0.15 162)" : "oklch(0.62 0.19 277)"}
                      strokeWidth="3.5"
                      strokeDasharray={`${(mandatoryPct / 100) * 87.96} 87.96`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Roadmap CTA */}
            <div className={sidebarOpen ? "px-4" : "px-2"}>
              <button
                onClick={() => setShowRoadmap(true)}
                title="View onboarding roadmap"
                className={`flex w-full items-center rounded-lg border border-accent/20 bg-accent/[0.07] text-accent transition-colors duration-200 hover:bg-accent/[0.14]
                  ${sidebarOpen ? "gap-2.5 px-3 py-2.5" : "justify-center p-2.5"}`}
              >
                <Map className="h-3.5 w-3.5 shrink-0" />
                {sidebarOpen && <span className="text-xs font-medium">View roadmap</span>}
              </button>
            </div>

            <div className={`border-t border-border ${sidebarOpen ? "mx-4" : "mx-2"}`} />

            {/* Category filter */}
            <div className={sidebarOpen ? "px-3" : "px-1.5"}>
              {sidebarOpen && <p className="mb-2 px-1 text-2xs font-semibold uppercase tracking-widest text-faint">Category</p>}
              <div className="space-y-0.5">
                {CATEGORY_OPTS.map(({ value, label, Icon, activeClass }) => {
                  const active = filterCategory === value;
                  const count  = categoryCounts[value];
                  return (
                    <button
                      key={value}
                      onClick={() => setFilterCategory(value)}
                      title={sidebarOpen ? undefined : label}
                      className={`flex w-full items-center rounded-md border text-xs font-medium transition-colors duration-150
                        ${sidebarOpen ? "gap-2.5 px-2.5 py-2" : "justify-center p-2.5"}
                        ${active ? activeClass : "border-transparent text-subtle hover:bg-surface hover:text-foreground"}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left">{label}</span>
                          <span className={`font-data text-2xs ${active ? "opacity-80" : "text-faint"}`}>{count}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status filter */}
            <div className={sidebarOpen ? "px-3" : "px-1.5"}>
              {sidebarOpen && <p className="mb-2 px-1 text-2xs font-semibold uppercase tracking-widest text-faint">Status</p>}
              <div className="space-y-0.5">
                {STATUS_OPTS.map(({ value, label, activeClass }) => {
                  const count  = value === "all" ? rows.length : rows.filter((r) => r.access_status === value).length;
                  if (value !== "all" && count === 0) return null;
                  const active = filterStatus === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setFilterStatus(value)}
                      title={sidebarOpen ? undefined : label}
                      className={`flex w-full items-center rounded-md border text-xs font-medium transition-colors duration-150
                        ${sidebarOpen ? "gap-2.5 px-2.5 py-2" : "justify-center p-2.5"}
                        ${active ? activeClass : "border-transparent text-subtle hover:bg-surface hover:text-foreground"}`}
                    >
                      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${active ? "border-current" : "border-border-strong"}`}>
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </span>
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left">{label}</span>
                          <span className={`font-data text-2xs ${active ? "opacity-80" : "text-faint"}`}>{count}</span>
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
          <div className="animate-fade-in max-w-5xl px-8 py-8 space-y-9">

            {/* Editorial welcome header (open, not a card) */}
            <div className="flex items-end justify-between gap-6 border-b border-border pb-7">
              <div className="min-w-0">
                <p className="mb-1.5 text-2xs font-semibold uppercase tracking-widest text-accent">Welcome aboard</p>
                <h1 className="text-2xl font-semibold leading-tight text-foreground">
                  Hi {session.full_name.split(" ")[0]}, you&apos;re a {session.role_name}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-subtle">
                  {allDone
                    ? "All mandatory tools are ready. You're set up and good to go."
                    : `${mandatory.length - grantedCount} mandatory tool${mandatory.length - grantedCount !== 1 ? "s" : ""} still need access. Use the assistant or request below.`}
                </p>
              </div>
              {allDone ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
              ) : (
                <div className="shrink-0 text-right">
                  <p className="font-data text-3xl font-semibold leading-none text-foreground">{Math.round(mandatoryPct)}<span className="text-xl text-subtle">%</span></p>
                  <p className="mt-1.5 text-2xs uppercase tracking-wider text-faint">setup complete</p>
                </div>
              )}
            </div>

            {/* Active filter pill + clear */}
            {isFiltered && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-subtle">Showing</span>
                {filterCategory !== "all" && (
                  <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium capitalize text-muted">{filterCategory}</span>
                )}
                {filterStatus !== "all" && (
                  <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted">{filterStatus.replace("_", " ")}</span>
                )}
                <span className="text-xs text-faint">· <span className="font-data">{filteredRows.length}</span> tool{filteredRows.length !== 1 ? "s" : ""}</span>
                <button
                  onClick={() => { setFilterCategory("all"); setFilterStatus("all"); }}
                  className="ml-0.5 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              </div>
            )}

            {/* Tool sections */}
            {isFiltered ? (
              filteredRows.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRows.map((r) => (
                    <AccessCard key={r.resource_id} row={r} session={session} onRequested={onRequested} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-faint">
                  <Circle className="h-8 w-8 stroke-[1.5]" />
                  <p className="text-sm">No tools match this filter.</p>
                </div>
              )
            ) : (
              <>
                {SECTIONS.map(({ key, label, dot, sub, items }) =>
                  items.length > 0 ? (
                    <section key={key} className="space-y-3.5">
                      <div className="flex items-baseline gap-2.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                        <h2 className="text-sm font-semibold text-foreground">{label}</h2>
                        <span className="text-xs text-faint">{sub}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((r) => (
                          <AccessCard key={r.resource_id} row={r} session={session} onRequested={onRequested} />
                        ))}
                      </div>
                    </section>
                  ) : null
                )}
                {rows.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 py-20 text-faint">
                    <CheckCircle2 className="h-10 w-10 stroke-[1.5]" />
                    <p className="text-sm">No resources configured for your role yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── RIGHT PANEL — AI Bot (floating) ────────────────────────── */}
        {botOpen && (
          <div
            className="animate-panel-in fixed z-30 flex flex-col rounded-xl border border-border-strong bg-surface/95 backdrop-blur-xl shadow-2xl shadow-black/50"
            style={{
              width: botWidth,
              top: "calc(3.5rem + 8px)",
              right: 12,
              bottom: 12,
            }}
          >
            {/* Drag handle — left edge */}
            <div
              onMouseDown={handleBotDragStart}
              className="absolute inset-y-0 -left-2 z-10 w-4 cursor-col-resize flex items-center justify-center group"
            >
              <div className="w-1 h-8 bg-border group-hover:bg-accent transition-colors duration-150 rounded-full" />
            </div>

            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="text-2xs font-semibold uppercase tracking-widest text-faint">AI Assistant</span>
              <button
                onClick={() => setBotOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
                aria-label="Close assistant"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-3">
              <SupportBot session={session} onAccessRequested={onRequested} />
            </div>
          </div>
        )}
      </div>

      {showRoadmap && (
        <RoadmapPanel session={session} rows={rows} onClose={() => setShowRoadmap(false)} />
      )}
    </div>
  );
}
