"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Loader2, UserPlus, X, Check, AlertCircle } from "lucide-react";
import type { Session, OrgStats } from "@/lib/types";

type Role = { id: string; name: string; color_hex: string };

function InviteUserModal({
  session,
  onClose,
  onSuccess,
}: {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((data) => {
        setRoles(data);
        if (data.length > 0) setRoleId(data[0].id);
      })
      .finally(() => setRolesLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        role_id: roleId,
        org_id: session.org_id,
        is_admin: isAdmin,
      }),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to create user");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-zinc-100">Invite New User</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-100">User invited successfully</p>
            <p className="text-xs text-zinc-500">They can now log in with their email address.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`name@${session.email_domain}`}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Role</label>
              {rolesLoading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading roles…
                </div>
              ) : (
                <select
                  required
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-indigo-500"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Grant admin privileges
              </span>
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rolesLoading}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                {loading ? "Inviting…" : "Send Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

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
      {showInviteModal && (
        <InviteUserModal
          session={session}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => fetchStats(session.org_id)}
        />
      )}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite User
          </button>
          <button
            onClick={() => { localStorage.removeItem("onboard-session"); router.push("/login"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
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
