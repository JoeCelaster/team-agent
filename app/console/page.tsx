"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/app/context/AppContext";
import {
  Users,
  Shield,
  Sliders,
  LayoutDashboard,
  Building2,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  Laptop,
  Info,
  ArrowLeft,
} from "lucide-react";
import {
  GithubIcon,
  SlackIcon,
  FigmaIcon,
  NotionIcon,
  GoogleDriveIcon,
  LinearIcon,
} from "@/components/BrandIcons";

type TabId = "overview" | "users" | "roles" | "access";

const NAV: { id: TabId; label: string; Icon: typeof Users }[] = [
  { id: "overview", label: "Dashboard", Icon: LayoutDashboard },
  { id: "users", label: "Users & Invites", Icon: Users },
  { id: "roles", label: "Roles", Icon: Shield },
  { id: "access", label: "Access Rule Book", Icon: Sliders },
];

export default function AdminConsole() {
  const {
    org,
    updateOrg,
    roles,
    addRole,
    deleteRole,
    users,
    inviteUser,
    deleteUser,
    tools,
    updateAccessMatrix,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [orgName, setOrgName] = useState(org.name);
  const [orgDomain, setOrgDomain] = useState(org.domain);
  const [orgSaved, setOrgSaved] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(roles[0]?.name || "Developer");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [roleSuccess, setRoleSuccess] = useState(false);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
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

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "Github": return <GithubIcon className="w-4 h-4 text-zinc-300" />;
      case "Slack": return <SlackIcon className="w-4 h-4 text-purple-400" />;
      case "BookOpen": return <NotionIcon className="w-4 h-4 text-amber-500" />;
      case "HardDrive": return <GoogleDriveIcon className="w-4 h-4 text-blue-400" />;
      case "Figma": return <FigmaIcon className="w-4 h-4 text-rose-500" />;
      case "CheckSquare": return <LinearIcon className="w-4 h-4 text-indigo-400" />;
      default: return <Laptop className="w-4 h-4" />;
    }
  };

  const inputCls =
    "w-full bg-[var(--canvas)] border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2.5 outline-none transition-colors focus:border-indigo-500 placeholder:text-zinc-600";
  const labelCls =
    "block text-[11px] font-medium text-zinc-500 mb-1.5";
  const primaryBtn =
    "w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out active:scale-[0.99] cursor-pointer";

  return (
    <div className="flex min-h-screen bg-[var(--canvas)] text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-60 border-r border-zinc-800/80 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-zinc-800/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-semibold text-white text-sm">
            {org.name[0]}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100 truncate">{org.name}</h2>
            <p className="text-[11px] text-zinc-500 truncate">@{org.domain}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  active
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800/60 space-y-3">
          <Link
            href="/sim"
            className="group flex items-center gap-1.5 px-2 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <ArrowLeft className="w-3 h-3 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
            Demo controls
          </Link>
          <div className="flex items-center gap-2 px-2 text-[11px] text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Admin mode active
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-8 py-8 max-w-5xl mx-auto w-full">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">Overview</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Team members, invitation status, and tool permissions at a glance.
              </p>
            </div>

            {/* Quiet stat row, not a card grid */}
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 border-y border-zinc-800/70 py-5">
              {[
                { label: "Directory", value: users.length, sub: "members" },
                { label: "Pending invites", value: users.filter((u) => u.status === "invited").length, sub: "awaiting activation", accent: true },
                { label: "Roles", value: roles.length, sub: "rulesets" },
                { label: "Integrations", value: tools.length, sub: "available apps" },
              ].map((s) => (
                <div key={s.label}>
                  <p className={`text-2xl font-semibold tabular-nums ${s.accent ? "text-indigo-400" : "text-zinc-100"}`}>
                    {s.value}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
                  <p className="text-[11px] text-zinc-600">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Org setup */}
              <div className="rounded-2xl border border-zinc-800/80 bg-[var(--surface)] p-5 space-y-4 md:col-span-1">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Organization
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Define organization defaults</p>
                </div>

                <form onSubmit={handleSaveOrg} className="space-y-3">
                  <div>
                    <label className={labelCls}>Company name</label>
                    <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Acme Corp" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Company domain</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600 text-sm select-none">@</span>
                      <input type="text" required value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} placeholder="company.com" className={`${inputCls} pl-6`} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out active:scale-[0.99] cursor-pointer">
                    Save configuration
                  </button>
                  {orgSaved && (
                    <div className="animate-rise-in bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-xs text-center font-medium">
                      Organization updated.
                    </div>
                  )}
                </form>
              </div>

              {/* Recent invites */}
              <div className="rounded-2xl border border-zinc-800/80 bg-[var(--surface)] p-5 md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">Recent invitations</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Team emails pending activation</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-[11px] uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 font-medium">Email</th>
                        <th className="py-2.5 font-medium">Role</th>
                        <th className="py-2.5 font-medium">Status</th>
                        <th className="py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-zinc-600">No team invites generated.</td></tr>
                      ) : (
                        users.slice(0, 5).map((user) => (
                          <tr key={user.email} className="transition-colors hover:bg-zinc-900/40">
                            <td className="py-3 font-medium text-zinc-300 truncate max-w-45">{user.email}</td>
                            <td className="py-3">{user.role}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                user.status === "joined"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}>{user.status}</span>
                            </td>
                            <td className="py-3 text-right">
                              {user.status === "invited" ? (
                                <button onClick={() => handleCopyLink(user.token)} className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer">
                                  {copiedToken === user.token ? <Check className="w-3 h-3 text-emerald-400 animate-pop-in" /> : <Copy className="w-3 h-3" />}
                                  {copiedToken === user.token ? "Copied" : "Copy link"}
                                </button>
                              ) : (
                                <span className="text-[11px] text-zinc-600">Joined</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">User management</h1>
              <p className="text-sm text-zinc-500 mt-1">Pre-configure accounts, assign roles, and dispatch invites.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="rounded-2xl border border-zinc-800/80 bg-[var(--surface)] p-5 space-y-4 lg:col-span-1">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-400" />
                    Invite a member
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Pre-assign their role</p>
                </div>
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Email address</label>
                    <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="dev@company.com" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Assign role</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={`${inputCls} cursor-pointer`}>
                      {roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className={primaryBtn}>Send invite link</button>
                  {inviteSuccess && (
                    <div className="animate-rise-in bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-2.5 rounded-lg text-xs text-center font-medium">
                      Invitation sent. Check the simulated inbox.
                    </div>
                  )}
                </form>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-[var(--surface)] p-5 lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">Team directory</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Workspace authorization registry</p>
                  </div>
                  <span className="text-[11px] text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded font-mono">{users.length} registered</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-[11px] uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 font-medium">User</th>
                        <th className="py-2.5 font-medium">Role</th>
                        <th className="py-2.5 font-medium">Status</th>
                        <th className="py-2.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.map((user) => (
                        <tr key={user.email} className="transition-colors hover:bg-zinc-900/40">
                          <td className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-semibold text-zinc-300 text-xs">
                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-zinc-200 truncate max-w-37.5">{user.name || "Awaiting setup"}</p>
                                <p className="text-[11px] text-zinc-500 truncate max-w-37.5">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-zinc-300">{user.role}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              user.status === "joined"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            }`}>{user.status === "joined" ? "Joined" : "Pending"}</span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {user.status === "invited" && (
                                <button onClick={() => handleCopyLink(user.token)} className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer">
                                  {copiedToken === user.token ? <Check className="w-3.5 h-3.5 text-emerald-400 animate-pop-in" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedToken === user.token ? "Copied" : "Copy"}
                                </button>
                              )}
                              <button
                                onClick={() => { if (confirm(`Revoke permissions and delete ${user.email}?`)) deleteUser(user.email); }}
                                className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
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
        )}

        {/* ROLES */}
        {activeTab === "roles" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">Role definitions</h1>
              <p className="text-sm text-zinc-500 mt-1">Configure roles and assign baseline tool permissions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="rounded-2xl border border-zinc-800/80 bg-[var(--surface)] p-5 space-y-4 lg:col-span-1">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    Create a role
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Scaffold a permission template</p>
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
                  <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Roles ({roles.length})</h3>
                  <span className="text-[11px] text-zinc-500">Each role is a baseline credential template</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roles.map((role) => (
                    <div key={role.id} className="rounded-2xl border border-zinc-800/80 bg-[var(--surface)] p-5 flex flex-col justify-between transition-colors hover:border-zinc-700">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-zinc-100">{role.name}</h4>
                          {!["admin", "developer", "designer", "pm"].includes(role.id) && (
                            <button
                              onClick={() => { if (confirm(`Delete role "${role.name}"?`)) deleteRole(role.id); }}
                              className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed min-h-10">{role.description}</p>
                      </div>
                      <div className="border-t border-zinc-800/60 pt-4 mt-4 space-y-2">
                        <span className="text-[11px] text-zinc-500 block">Granted access ({role.allowedTools.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {role.allowedTools.length === 0 ? (
                            <span className="text-[11px] text-zinc-600 italic">No tools mapped</span>
                          ) : (
                            role.allowedTools.map((toolId) => {
                              const tool = tools.find((t) => t.id === toolId);
                              return tool ? (
                                <span key={toolId} className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[11px] font-medium text-zinc-400">
                                  {getToolIcon(tool.iconName)}
                                  {tool.name}
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

        {/* ACCESS */}
        {activeTab === "access" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">Access rule book</h1>
              <p className="text-sm text-zinc-500 mt-1">Cross-reference role-to-tool permissions. Toggles apply to all matching dashboards.</p>
            </div>

            <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.04] p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                <span className="font-medium text-indigo-200">Real-time sync:</span> when a new joiner accepts their invite, their profile reads this matrix. Toggling a privilege adjusts access for every user matching that role.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[var(--surface)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-zinc-800">
                    <tr>
                      <th className="p-5 font-medium text-zinc-400 w-48">Roles</th>
                      {tools.map((tool) => (
                        <th key={tool.id} className="p-5 font-medium text-center border-l border-zinc-800/60 min-w-30">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="p-1.5 rounded-lg bg-zinc-900">{getToolIcon(tool.iconName)}</div>
                            <span className="text-zinc-200 text-xs">{tool.name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{tool.category}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {roles.map((role) => (
                      <tr key={role.id} className="transition-colors hover:bg-zinc-900/30">
                        <td className="p-5">
                          <p className="font-medium text-sm text-zinc-200">{role.name}</p>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-50 line-clamp-2">{role.description}</p>
                        </td>
                        {tools.map((tool) => {
                          const isAllowed = role.allowedTools.includes(tool.id);
                          return (
                            <td key={tool.id} className="p-5 text-center border-l border-zinc-800/60">
                              <label className="relative inline-flex items-center justify-center cursor-pointer select-none">
                                <input type="checkbox" checked={isAllowed} onChange={(e) => updateAccessMatrix(role.id, tool.id, e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-zinc-800 rounded-full transition-colors duration-200 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 after:ease-out peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                              </label>
                              <div className="mt-1.5">
                                <span className={`text-[10px] font-medium ${isAllowed ? "text-indigo-400" : "text-zinc-600"}`}>
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
      </main>
    </div>
  );
}
