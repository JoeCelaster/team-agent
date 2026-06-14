"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Shield, Sliders, LayoutDashboard, Building2,
  Plus, Trash2, Copy, Check, Send, Laptop, Info,
  ArrowLeft, UserPlus, X, AlertCircle, Loader2,
  CheckCircle2, XCircle, Inbox, LogOut, Bot, User, AlertTriangle,
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import {
  GithubIcon, SlackIcon, FigmaIcon, NotionIcon, GoogleDriveIcon, LinearIcon,
} from "@/components/BrandIcons";
import type { Session, OrgStats, AdminRequestRow } from "@/lib/types";
import { ApprovalAssistant } from "./components/ApprovalAssistant";

type TabId = "overview" | "users" | "roles" | "access";

const NAV: { id: TabId; label: string; Icon: typeof Users }[] = [
  { id: "overview", label: "Dashboard",       Icon: LayoutDashboard },
  { id: "users",    label: "Users & Invites",  Icon: Users           },
  { id: "roles",    label: "Roles",            Icon: Shield          },
  { id: "access",   label: "Access Rule Book", Icon: Sliders         },
];

// ─── Invite modal ────────────────────────────────────────────────────────────

type Role = { id: string; name: string; color_hex: string };

function InviteUserModal({
  session, onClose, onSuccess,
}: { session: Session; onClose: () => void; onSuccess: () => void }) {
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [roleId, setRoleId]           = useState("");
  const [isAdmin, setIsAdmin]         = useState(false);
  const [roles, setRoles]             = useState<Role[]>([]);
  const [loading, setLoading]         = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((data) => { setRoles(data); if (data.length > 0) setRoleId(data[0].id); })
      .finally(() => setRolesLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, role_id: roleId, org_id: session.org_id, is_admin: isAdmin }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) { setError(body.error ?? "Failed to create user"); return; }
    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="animate-rise-in w-full max-w-md rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Invite new user</h2>
          </div>
          <button onClick={onClose} className="text-subtle transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {success ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/15">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">User invited successfully</p>
            <p className="text-xs text-subtle">They can now log in with their email address.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-2xs font-semibold uppercase tracking-widest text-faint">Full name</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith"
                className="w-full rounded-md border border-border bg-inset px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent" />
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs font-semibold uppercase tracking-widest text-faint">Email address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={`name@${session.email_domain}`}
                className="w-full rounded-md border border-border bg-inset px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent" />
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs font-semibold uppercase tracking-widest text-faint">Role</label>
              {rolesLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-subtle">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading roles…
                </div>
              ) : (
                <select required value={roleId} onChange={(e) => setRoleId(e.target.value)}
                  className="w-full rounded-md border border-border bg-inset px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent">
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
            </div>
            <label className="group flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong bg-inset accent-[var(--accent)]" />
              <span className="text-xs text-muted transition-colors group-hover:text-foreground">Grant admin privileges</span>
            </label>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-md border border-border py-2.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
                Cancel
              </button>
              <button type="submit" disabled={loading || rolesLoading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                {loading ? "Inviting…" : "Send invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Request row (inline approval queue) ─────────────────────────────────────

function QueueRow({
  row, session, onAction,
}: { row: AdminRequestRow; session: Session; onAction: () => void }) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);

  const act = async (action: "approve" | "deny") => {
    setLoading(action);
    try {
      await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: row.request_id, reviewer_id: session.id }),
      });
      onAction();
    } finally {
      setLoading(null);
    }
  };

  return (
    <tr className="border-b border-border/60 transition-colors hover:bg-surface-2/40 group">
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold text-muted ring-1 ring-inset ring-border">
            {row.employee_name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{row.employee_name}</p>
            <p className="text-[10px] text-subtle truncate">{row.role_name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs font-medium text-foreground">{row.resource_name}</span>
          {!row.is_role_relevant && (
            <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" /> Out of scope
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
          {row.requested_by === "agent"
            ? <><Bot className="h-3 w-3 text-accent" /> Agent</>
            : <><User className="h-3 w-3 text-subtle" /> Employee</>}
        </span>
      </td>
      <td className="max-w-[200px] min-w-[150px] px-4 py-4">
        <p className="text-[11px] leading-relaxed text-subtle line-clamp-2" title={row.employee_note ?? undefined}>
          {row.employee_note ? `"${row.employee_note}"` : "—"}
        </p>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="font-data text-xs text-subtle">
          {new Date(row.requested_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          <button onClick={() => act("approve")} disabled={!!loading} title="Approve"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-all hover:bg-emerald-500/20 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
            {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => act("deny")} disabled={!!loading} title="Deny"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:bg-red-500/20 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
            {loading === "deny" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { org, updateOrg, roles, addRole, deleteRole, users, inviteUser, deleteUser, tools, updateAccessMatrix } = useApp();

  const [session, setSession]           = useState<Session | null>(null);
  const [stats, setStats]               = useState<OrgStats | null>(null);
  const [queue, setQueue]               = useState<AdminRequestRow[]>([]);
  const [activeTab, setActiveTab]       = useState<TabId>("overview");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Overview form state
  const [orgName, setOrgName]   = useState(org.name);
  const [orgDomain, setOrgDomain] = useState(org.domain);
  const [orgSaved, setOrgSaved] = useState(false);

  // Roles form state
  const [newRoleName, setNewRoleName]   = useState("");
  const [newRoleDesc, setNewRoleDesc]   = useState("");
  const [roleSuccess, setRoleSuccess]   = useState(false);

  // Users tab state
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteRole, setInviteRole]     = useState(roles[0]?.name || "Developer");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [copiedToken, setCopiedToken]   = useState<string | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);

  // Auth
  useEffect(() => {
    const raw = localStorage.getItem("onboard-session");
    if (!raw) { router.replace("/login"); return; }
    const s = JSON.parse(raw) as Session;
    if (!s.is_admin) { router.replace("/dashboard"); return; }
    setSession(s);
  }, [router]);

  const fetchStats = useCallback(async (orgId: string) => {
    const res = await fetch(`/api/admin/stats?org_id=${orgId}`, { cache: "no-store" });
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchQueue = useCallback(async (orgId: string) => {
    setQueueLoading(true);
    const res = await fetch(`/api/admin/queue?org_id=${orgId}`, { cache: "no-store" });
    if (res.ok) setQueue(await res.json());
    setQueueLoading(false);
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchStats(session.org_id);
  }, [session, fetchStats]);

  useEffect(() => {
    if (!session || activeTab !== "users") return;
    fetchQueue(session.org_id);
  }, [session, activeTab, fetchQueue]);

  const handleQueueAction = () => {
    if (!session) return;
    fetchQueue(session.org_id);
    fetchStats(session.org_id);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg({ name: orgName, domain: orgDomain });
    setOrgSaved(true);
    setTimeout(() => setOrgSaved(false), 3000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteUser(inviteEmail, inviteRole);
    setInviteEmail("");
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    addRole({ name: newRoleName, description: newRoleDesc, allowedTools: [] });
    setNewRoleName("");
    setNewRoleDesc("");
    setRoleSuccess(true);
    setTimeout(() => setRoleSuccess(false), 3000);
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "Github":      return <GithubIcon className="w-4 h-4 text-muted" />;
      case "Slack":       return <SlackIcon className="w-4 h-4 text-purple-400" />;
      case "BookOpen":    return <NotionIcon className="w-4 h-4 text-amber-500" />;
      case "HardDrive":   return <GoogleDriveIcon className="w-4 h-4 text-blue-400" />;
      case "Figma":       return <FigmaIcon className="w-4 h-4 text-rose-500" />;
      case "CheckSquare": return <LinearIcon className="w-4 h-4 text-indigo-400" />;
      default:            return <Laptop className="w-4 h-4" />;
    }
  };

  const inputCls  = "w-full bg-inset border border-border text-foreground text-sm rounded-md px-3 py-2.5 outline-none transition-colors focus:border-accent placeholder:text-faint";
  const labelCls  = "block text-2xs font-medium text-faint mb-1.5";
  const primaryBtn = "w-full flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ease-out active:scale-[0.99] cursor-pointer";

  const orgLabel = session?.org_name ?? org.name;

  return (
    <div className="flex min-h-screen bg-canvas text-foreground font-sans">
      {showInviteModal && session && (
        <InviteUserModal
          session={session}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => session && fetchStats(session.org_id)}
        />
      )}

      {/* Sidebar */}
      <aside className="w-60 border-r border-border flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-semibold text-white text-sm">
            {orgLabel[0]}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">{orgLabel}</h2>
            <p className="text-2xs text-subtle truncate">@{org.domain}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  active ? "bg-indigo-500/10 text-indigo-300" : "text-muted hover:text-foreground hover:bg-surface-2/60"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {id === "users" && (stats?.open_requests ?? 0) > 0 && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-2xs font-semibold text-white">
                    {stats!.open_requests}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-2/60 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Invite user
          </button>
          <button
            onClick={() => { localStorage.removeItem("onboard-session"); router.push("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-2/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
          <div className="pt-1 border-t border-border/60">
            <a href="/sim" className="group flex items-center gap-1.5 px-2 py-1 text-2xs text-subtle transition-colors hover:text-muted">
              <ArrowLeft className="w-3 h-3 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
              Demo controls
            </a>
            <div className="flex items-center gap-2 px-2 py-1 text-2xs text-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Admin mode active
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto w-full px-8 py-8">

        {/* DASHBOARD */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Overview</h1>
              <p className="text-sm text-subtle mt-1">{orgLabel} onboarding dashboard</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 border-y border-border/70 py-5">
              {[
                { label: "Total employees", value: stats?.total_employees ?? "—", sub: "in your organisation",   dot: "bg-faint"        },
                { label: "Active",          value: stats?.active_count      ?? "—", sub: "logged in at least once", dot: "bg-emerald-400" },
                { label: "Pending login",   value: stats?.pending_login_count ?? "—", sub: "invite not yet accepted", dot: "bg-amber-400"  },
                { label: "Open requests",   value: stats?.open_requests      ?? "—", sub: "awaiting review",      dot: "bg-red-400"      },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    <p className="text-xs text-muted">{s.label}</p>
                  </div>
                  <p className="font-data text-3xl font-semibold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-2xs text-faint">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Org settings */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4 md:col-span-1">
                <div>
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Organization
                  </h3>
                  <p className="text-xs text-subtle mt-0.5">Define organization defaults</p>
                </div>
                <form onSubmit={handleSaveOrg} className="space-y-3">
                  <div>
                    <label className={labelCls}>Company name</label>
                    <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Acme Corp" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Company domain</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-faint text-sm select-none">@</span>
                      <input type="text" required value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} placeholder="company.com" className={`${inputCls} pl-6`} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-surface-2 hover:bg-surface-2 text-foreground border border-border-strong py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out active:scale-[0.99] cursor-pointer">
                    Save configuration
                  </button>
                  {orgSaved && (
                    <div className="animate-rise-in bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-xs text-center font-medium">
                      Organization updated.
                    </div>
                  )}
                </form>
              </div>

              {/* Approval queue summary */}
              <div className="rounded-xl border border-border bg-surface p-5 md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Approval queue</h3>
                  <p className="text-xs text-subtle mt-0.5">Access requests awaiting your review</p>
                </div>
                <button
                  onClick={() => setActiveTab("users")}
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-inset p-4 transition-colors hover:border-accent/30 hover:bg-surface-2"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {(stats?.open_requests ?? 0) > 0
                        ? `${stats!.open_requests} request${stats!.open_requests !== 1 ? "s" : ""} waiting`
                        : "Queue is clear"}
                    </p>
                    <p className="mt-0.5 text-xs text-subtle">Go to Users & Invites to review</p>
                  </div>
                  {(stats?.open_requests ?? 0) > 0 && (
                    <span className="font-data flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-2xs font-semibold text-white">
                      {stats!.open_requests}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USERS & INVITES */}
        {activeTab === "users" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">Users & Invites</h1>
                <p className="text-sm text-subtle mt-1">Invite members, review access requests, and manage your team directory.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              <div className="xl:col-span-2 space-y-8 min-w-0">
                {/* Premium Invite Banner */}
                <div className="relative rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-5 overflow-hidden shadow-sm">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative z-10 flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Send className="w-4 h-4 text-indigo-400" /> Invite a member
                    </h3>
                    <p className="text-sm text-subtle mt-1">Quickly send an invite link with a pre-assigned role.</p>
                  </div>
                  <form onSubmit={handleInviteSubmit} className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full 2xl:w-auto">
                    <div className="w-full sm:w-52">
                      <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                    </div>
                    <div className="w-full sm:w-36">
                      <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={`${inputCls} cursor-pointer`}>
                        {roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ease-out active:scale-[0.99] whitespace-nowrap">
                      Send link
                    </button>
                    <button type="button" onClick={() => setShowInviteModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-border bg-surface hover:bg-surface-2 text-foreground px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                      <UserPlus className="w-4 h-4" /> Full form
                    </button>
                  </form>
                  {inviteSuccess && (
                    <div className="absolute top-4 right-4 animate-rise-in bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-md text-xs font-medium z-20">
                      Invitation sent!
                    </div>
                  )}
                </div>

                {/* Pending access requests */}
                <div className="relative rounded-xl border border-indigo-500/15 bg-indigo-500/[0.02] overflow-hidden shadow-sm">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/8 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative z-10 border-t-2 border-t-indigo-500/20">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/80">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Pending access requests</h3>
                      <p className="text-xs text-subtle mt-0.5">Approve or deny tool access for your team</p>
                    </div>
                    {queue.length > 0 && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-2xs font-semibold text-amber-400">
                        <span className="font-data">{queue.length}</span> pending
                      </span>
                    )}
                  </div>
                  {queueLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-xs text-subtle">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
                    </div>
                  ) : queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                      <Inbox className="h-8 w-8 text-faint stroke-[1.5]" />
                      <p className="text-sm font-medium text-subtle">Queue is empty</p>
                      <p className="text-xs text-faint">All access requests have been reviewed.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="border-b border-border text-2xs uppercase tracking-wider text-faint">
                          <tr>
                            <th className="px-4 py-3.5 font-semibold whitespace-nowrap">Employee</th>
                            <th className="px-4 py-3.5 font-semibold whitespace-nowrap">Resource</th>
                            <th className="px-4 py-3.5 font-semibold whitespace-nowrap">Source</th>
                            <th className="px-4 py-3.5 font-semibold">Note</th>
                            <th className="px-4 py-3.5 font-semibold whitespace-nowrap">Date</th>
                            <th className="px-4 py-3.5 font-semibold whitespace-nowrap text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queue.map((row) => (
                            <QueueRow key={row.request_id} row={row} session={session!} onAction={handleQueueAction} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  </div>
                </div>

                {/* Team directory */}
                <div className="relative rounded-xl border border-indigo-500/15 bg-indigo-500/[0.02] overflow-hidden shadow-sm">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/8 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative z-10 border-t-2 border-t-indigo-500/20 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Team directory</h3>
                      <p className="text-xs text-subtle mt-0.5">Workspace authorization registry</p>
                    </div>
                    <span className="text-2xs text-muted border border-border px-2 py-0.5 rounded font-mono">{users.length} registered</span>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left text-muted">
                      <thead className="text-2xs uppercase tracking-wide text-subtle border-b border-border">
                        <tr>
                          <th className="py-2.5 font-medium">User</th>
                          <th className="py-2.5 font-medium">Role</th>
                          <th className="py-2.5 font-medium">Status</th>
                          <th className="py-2.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map((user) => (
                          <tr key={user.email} className="transition-colors hover:bg-surface-2/50">
                            <td className="py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center font-semibold text-muted text-xs">
                                  {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate max-w-37.5">{user.name || "Awaiting setup"}</p>
                                  <p className="text-2xs text-subtle truncate max-w-37.5">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 text-muted">{user.role}</td>
                            <td className="py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium ${
                                user.status === "joined"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}>{user.status === "joined" ? "Joined" : "Pending"}</span>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-3">
                                {user.status === "invited" && (
                                  <button onClick={() => handleCopyLink(user.token)}
                                    className="text-2xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer">
                                    {copiedToken === user.token ? <Check className="w-3.5 h-3.5 text-emerald-400 animate-pop-in" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedToken === user.token ? "Copied" : "Copy"}
                                  </button>
                                )}
                                <button
                                  onClick={() => { if (confirm(`Revoke permissions and delete ${user.email}?`)) deleteUser(user.email); }}
                                  className="text-faint hover:text-red-400 p-1 rounded hover:bg-surface-2 transition-colors cursor-pointer"
                                  title="Revoke access"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Assistant (Sticky) */}
              <div className="xl:col-span-1">
                <div className="sticky top-8">
                  <ApprovalAssistant session={session!} queue={queue} onAction={handleQueueAction} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROLES */}
        {activeTab === "roles" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Role definitions</h1>
              <p className="text-sm text-subtle mt-1">Configure roles and assign baseline tool permissions.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4 lg:col-span-1">
                <div>
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-400" /> Create a role
                  </h3>
                  <p className="text-xs text-subtle mt-0.5">Scaffold a permission template</p>
                </div>
                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div>
                    <label className={labelCls}>Role name</label>
                    <input type="text" required value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. QA Engineer" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea required rows={3} value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="Brief summary of duties" className={`${inputCls} resize-none`} />
                  </div>
                  <button type="submit" className={primaryBtn}>Add role template</button>
                  {roleSuccess && (
                    <div className="animate-rise-in bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-xs text-center font-medium">
                      Role created. Map its tools in the rule book.
                    </div>
                  )}
                </form>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-medium text-muted uppercase tracking-wide">Roles ({roles.length})</h3>
                  <span className="text-2xs text-subtle">Each role is a baseline credential template</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roles.map((role) => (
                    <div key={role.id} className="rounded-xl border border-border bg-surface p-5 flex flex-col justify-between transition-colors hover:border-border-strong">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground">{role.name}</h4>
                          {!["admin", "developer", "designer", "pm"].includes(role.id) && (
                            <button onClick={() => { if (confirm(`Delete role "${role.name}"?`)) deleteRole(role.id); }}
                              className="text-faint hover:text-red-400 p-1.5 rounded hover:bg-surface-2 transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted leading-relaxed min-h-10">{role.description}</p>
                      </div>
                      <div className="border-t border-border pt-4 mt-4 space-y-2">
                        <span className="text-2xs text-subtle block">Granted access ({role.allowedTools.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {role.allowedTools.length === 0 ? (
                            <span className="text-2xs text-faint italic">No tools mapped</span>
                          ) : (
                            role.allowedTools.map((toolId) => {
                              const tool = tools.find((t) => t.id === toolId);
                              return tool ? (
                                <span key={toolId} className="inline-flex items-center gap-1 bg-inset border border-border px-2 py-1 rounded text-2xs font-medium text-muted">
                                  {getToolIcon(tool.iconName)} {tool.name}
                                </span>
                              ) : null;
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCESS RULE BOOK */}
        {activeTab === "access" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Access rule book</h1>
              <p className="text-sm text-subtle mt-1">Cross-reference role-to-tool permissions. Toggles apply to all matching dashboards.</p>
            </div>
            <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                <span className="font-medium text-indigo-200">Real-time sync:</span> when a new joiner accepts their invite, their profile reads this matrix. Toggling a privilege adjusts access for every user matching that role.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="p-5 font-medium text-muted w-48">Roles</th>
                      {tools.map((tool) => (
                        <th key={tool.id} className="p-5 font-medium text-center border-l border-border min-w-30">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="p-1.5 rounded-lg bg-inset">{getToolIcon(tool.iconName)}</div>
                            <span className="text-foreground text-xs">{tool.name}</span>
                            <span className="text-2xs text-subtle uppercase tracking-wide">{tool.category}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roles.map((role) => (
                      <tr key={role.id} className="transition-colors hover:bg-surface-2/50">
                        <td className="p-5">
                          <p className="font-medium text-sm text-foreground">{role.name}</p>
                          <p className="text-2xs text-subtle mt-1 leading-relaxed max-w-50 line-clamp-2">{role.description}</p>
                        </td>
                        {tools.map((tool) => {
                          const isAllowed = role.allowedTools.includes(tool.id);
                          return (
                            <td key={tool.id} className="p-5 text-center border-l border-border">
                              <label className="relative inline-flex items-center justify-center cursor-pointer select-none">
                                <input type="checkbox" checked={isAllowed} onChange={(e) => updateAccessMatrix(role.id, tool.id, e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-surface-2 rounded-full transition-colors duration-200 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 after:ease-out peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                              </label>
                              <div className="mt-1.5">
                                <span className={`text-2xs font-medium ${isAllowed ? "text-indigo-400" : "text-faint"}`}>
                                  {isAllowed ? "Granted" : "Denied"}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
