"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Users, Clock, CheckCircle2, Copy, Check,
  Laptop, Shield, Mail, Calendar,
} from "lucide-react";
import {
  GithubIcon, SlackIcon, FigmaIcon, NotionIcon, GoogleDriveIcon, LinearIcon,
} from "@/components/BrandIcons";
import type { Session } from "@/lib/types";

type TabId = "active" | "pending";

type ActiveEmployee = {
  id: string;
  full_name: string;
  email: string;
  status: "active";
  is_admin: boolean;
  created_at: string;
  roles: { name: string; color_hex: string } | null;
  granted_tools: string[];
};

type PendingEmployee = {
  id: string;
  full_name: string;
  email: string;
  status: "invited";
  is_admin: boolean;
  created_at: string;
  roles: { name: string; color_hex: string } | null;
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  GitHub:       <GithubIcon className="w-3 h-3" />,
  Slack:        <SlackIcon className="w-3 h-3 text-purple-400" />,
  Notion:       <NotionIcon className="w-3 h-3 text-amber-500" />,
  "Google Drive": <GoogleDriveIcon className="w-3 h-3 text-blue-400" />,
  Figma:        <FigmaIcon className="w-3 h-3 text-rose-500" />,
  Linear:       <LinearIcon className="w-3 h-3 text-indigo-400" />,
};

function ToolChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-inset border border-border px-2 py-0.5 rounded-md text-2xs font-medium text-muted whitespace-nowrap">
      {TOOL_ICONS[name] ?? <Laptop className="w-3 h-3" />}
      {name}
    </span>
  );
}

function Avatar({ name, email, colorHex }: { name: string; email: string; colorHex?: string }) {
  const initials = name
    ? name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : email[0].toUpperCase();

  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0 text-white"
      style={{ backgroundColor: colorHex ?? "#6366f1" }}
    >
      {initials}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function EmployeesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) ?? "active";

  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("onboard-session");
    if (!raw) { router.replace("/login"); return; }
    const s = JSON.parse(raw) as Session;
    if (!s.is_admin) { router.replace("/dashboard"); return; }
    setSession(s);
  }, [router]);

  const fetchEmployees = useCallback(async (orgId: string, status: TabId) => {
    setLoading(true);
    const apiStatus = status === "active" ? "active" : "invited";
    const res = await fetch(`/api/admin/employees?org_id=${orgId}&status=${apiStatus}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (status === "active") setActiveEmployees(data);
      else setPendingEmployees(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchEmployees(session.org_id, tab);
  }, [session, tab, fetchEmployees]);

  const handleCopyLink = (employeeId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${employeeId}`);
    setCopiedId(employeeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTabChange = (t: TabId) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground font-sans">
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <button
              onClick={() => router.push("/admin")}
              className="group flex items-center gap-1.5 text-2xs text-subtle hover:text-muted transition-colors mb-3"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              Back to admin
            </button>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Employee status</h1>
            <p className="text-sm text-subtle">Track who has logged in and what access they have.</p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-surface border border-border w-fit">
          <button
            onClick={() => handleTabChange("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === "active"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "text-subtle hover:text-muted"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
            {activeEmployees.length > 0 && (
              <span className="font-data text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                {activeEmployees.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === "pending"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                : "text-subtle hover:text-muted"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending login
            {pendingEmployees.length > 0 && (
              <span className="font-data text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                {pendingEmployees.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-subtle text-sm">
            Loading…
          </div>
        ) : tab === "active" ? (
          <ActiveTab employees={activeEmployees} />
        ) : (
          <PendingTab
            employees={pendingEmployees}
            copiedId={copiedId}
            onCopyLink={handleCopyLink}
          />
        )}
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <EmployeesContent />
    </Suspense>
  );
}

function ActiveTab({ employees }: { employees: ActiveEmployee[] }) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-8 h-8 text-faint" />}
        title="No active employees yet"
        description="Employees will appear here once they log in for the first time."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-subtle">
        {employees.length} employee{employees.length !== 1 ? "s" : ""} logged in
      </p>
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-inset/50">
              <th className="px-5 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-subtle">Employee</th>
              <th className="px-5 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-subtle">Role</th>
              <th className="px-5 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-subtle">Granted access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((emp) => (
              <tr key={emp.id} className="transition-colors hover:bg-surface-2/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.full_name} email={emp.email} colorHex={emp.roles?.color_hex} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-foreground truncate">{emp.full_name || "—"}</p>
                        {emp.is_admin && (
                          <span className="inline-flex items-center gap-0.5 text-2xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-faint" />
                        <p className="text-2xs text-subtle truncate">{emp.email}</p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {emp.roles ? (
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-2xs font-semibold"
                      style={{
                        backgroundColor: `${emp.roles.color_hex}20`,
                        color: emp.roles.color_hex,
                        borderColor: `${emp.roles.color_hex}40`,
                        border: "1px solid",
                      }}
                    >
                      {emp.roles.name}
                    </span>
                  ) : (
                    <span className="text-2xs text-faint">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {emp.granted_tools.length === 0 ? (
                    <span className="text-2xs text-faint italic">No access granted yet</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {emp.granted_tools.map((tool) => (
                        <ToolChip key={tool} name={tool} />
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingTab({
  employees,
  copiedId,
  onCopyLink,
}: {
  employees: PendingEmployee[];
  copiedId: string | null;
  onCopyLink: (id: string) => void;
}) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-8 h-8 text-faint" />}
        title="No pending invites"
        description="All invited employees have already logged in."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-subtle">
        {employees.length} employee{employees.length !== 1 ? "s" : ""} haven't logged in yet
      </p>
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-inset/50">
              <th className="px-5 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-subtle">Employee</th>
              <th className="px-5 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-subtle">Role</th>
              <th className="px-5 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-subtle">Invited</th>
              <th className="px-5 py-3 text-right text-2xs font-semibold uppercase tracking-wider text-subtle">Invite link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((emp) => (
              <tr key={emp.id} className="transition-colors hover:bg-surface-2/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.full_name} email={emp.email} colorHex={emp.roles?.color_hex} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-foreground truncate">
                          {emp.full_name || <span className="text-faint italic">Awaiting setup</span>}
                        </p>
                        {emp.is_admin && (
                          <span className="inline-flex items-center gap-0.5 text-2xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-faint" />
                        <p className="text-2xs text-subtle truncate">{emp.email}</p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {emp.roles ? (
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-2xs font-semibold"
                      style={{
                        backgroundColor: `${emp.roles.color_hex}20`,
                        color: emp.roles.color_hex,
                        borderColor: `${emp.roles.color_hex}40`,
                        border: "1px solid",
                      }}
                    >
                      {emp.roles.name}
                    </span>
                  ) : (
                    <span className="text-2xs text-faint">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-2xs text-subtle">
                    <Calendar className="w-3 h-3 text-faint" />
                    {formatDate(emp.created_at)}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onCopyLink(emp.id)}
                    className="inline-flex items-center gap-1.5 text-2xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copiedId === emp.id ? (
                      <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy link</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div className="p-4 rounded-full bg-surface border border-border">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-subtle max-w-xs">{description}</p>
    </div>
  );
}
