"use client";

import React, { useState } from "react";
import { useApp, Role, User } from "@/app/context/AppContext";
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
  Mail, 
  Globe, 
  Send,
  Laptop, 
  Sparkles,
  Info,
  ExternalLink
} from "lucide-react";
import {
  GithubIcon,
  SlackIcon,
  FigmaIcon,
  NotionIcon,
  GoogleDriveIcon,
  LinearIcon
} from "@/components/BrandIcons";
import { useRouter } from "next/navigation";

type TabId = "overview" | "users" | "roles" | "access";

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
    updateAccessMatrix 
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  
  // State for Organization Setup
  const [orgName, setOrgName] = useState(org.name);
  const [orgDomain, setOrgDomain] = useState(org.domain);
  const [orgSaved, setOrgSaved] = useState(false);

  // State for Invite User Form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(roles[0]?.name || "Developer");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // State for Create Role Form
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [roleSuccess, setRoleSuccess] = useState(false);

  // Copy invitation link helper
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

    // Check if domain is correct (optional warning but we allow any)
    inviteUser(inviteEmail, inviteRole);
    setInviteEmail("");
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    addRole({
      name: newRoleName,
      description: newRoleDesc,
      allowedTools: [],
    });
    setNewRoleName("");
    setNewRoleDesc("");
    setRoleSuccess(true);
    setTimeout(() => setRoleSuccess(false), 3000);
  };

  // Get matching tool icon
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

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* 1. Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col shrink-0">
        {/* Organization Branding */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            {org.name[0]}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-zinc-100 truncate">{org.name}</h2>
            <p className="text-[10px] text-zinc-500 truncate">@{org.domain}</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "overview"
                ? "bg-zinc-800 text-zinc-100 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "users"
                ? "bg-zinc-800 text-zinc-100 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Users & Invites
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "roles"
                ? "bg-zinc-800 text-zinc-100 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
          >
            <Shield className="w-4 h-4" />
            Roles Management
          </button>

          <button
            onClick={() => setActiveTab("access")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === "access"
                ? "bg-zinc-800 text-zinc-100 shadow-inner"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Access Rule Book
          </button>
        </nav>

        {/* Console footer Info */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/10">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Admin Mode Active</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto p-8 max-w-6xl mx-auto w-full pb-32">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Overview Dashboard</h1>
                <p className="text-xs text-zinc-500 mt-1">Operational view of team members, invitation statuses, and tool permissions</p>
              </div>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl space-y-1 shadow-md">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Directory</span>
                <p className="text-2xl font-black text-zinc-100">{users.length}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Synced members</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl space-y-1 shadow-md">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Pending Invites</span>
                <p className="text-2xl font-black text-indigo-400">
                  {users.filter(u => u.status === "invited").length}
                </p>
                <p className="text-[10px] text-zinc-500 font-medium">Awaiting activation</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl space-y-1 shadow-md">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Custom Roles</span>
                <p className="text-2xl font-black text-zinc-100">{roles.length}</p>
                <p className="text-[10px] text-zinc-500 font-medium">Assigned rulesets</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl space-y-1 shadow-md">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active Apps</span>
                <p className="text-2xl font-black text-zinc-100">{tools.length}</p>
                <p className="text-[10px] text-zinc-500 font-medium">Available integrations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Organization Setup Form */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-md md:col-span-1">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Organization Setup
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Define organization defaults</p>
                </div>

                <form onSubmit={handleSaveOrg} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Company Domain
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600 text-xs select-none">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={orgDomain}
                        onChange={(e) => setOrgDomain(e.target.value)}
                        placeholder="company.com"
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl pl-6 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Save Configuration
                  </button>

                  {orgSaved && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-[10px] text-center font-medium animate-fade-in">
                      Organization updated successfully!
                    </div>
                  )}
                </form>
              </div>

              {/* Recent Invites table */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-md md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300">Recent Invitations</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Recent team emails pending activation</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-zinc-400">
                    <thead className="text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5">Email</th>
                        <th className="py-2.5">Role</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-zinc-600 font-medium">
                            No team invites generated.
                          </td>
                        </tr>
                      ) : (
                        users.slice(0, 5).map((user) => (
                          <tr key={user.email}>
                            <td className="py-3 font-semibold text-zinc-300 truncate max-w-[180px]">
                              {user.email}
                            </td>
                            <td className="py-3">{user.role}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                user.status === "joined" 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {user.status === "invited" ? (
                                <button
                                  onClick={() => handleCopyLink(user.token)}
                                  className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedToken === user.token ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedToken === user.token ? "Copied" : "Copy Link"}
                                </button>
                              ) : (
                                <span className="text-[10px] text-zinc-600">Joined</span>
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

        {/* USERS & INVITES TAB */}
        {activeTab === "users" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">User Management</h1>
              <p className="text-xs text-zinc-500 mt-1">Pre-configure team accounts, assign roles, and dispatch portal invites</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Add User Form */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-md lg:col-span-1">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-400" />
                    Invite Team Member
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Pre-assign security configuration</p>
                </div>

                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="dev@company.com"
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Assign Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                  >
                    Send Invite Link
                  </button>

                  {inviteSuccess && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2.5 rounded-lg text-[10px] text-center font-medium animate-bounce">
                      Invitation dispatched! Simulator inbox updated.
                    </div>
                  )}
                </form>
              </div>

              {/* Team Directory Table */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-md lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-300">Team Directory</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Workspace authorization registry</p>
                  </div>
                  <span className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded font-mono">
                    {users.length} registered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-zinc-400">
                    <thead className="text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5">User</th>
                        <th className="py-2.5">Pre-Assigned Role</th>
                        <th className="py-2.5">Invite Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.map((user) => (
                        <tr key={user.email} className="hover:bg-zinc-900/40">
                          {/* User card info */}
                          <td className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-xs">
                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-zinc-200 truncate max-w-[150px]">
                                  {user.name || "Awaiting Setup"}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Predefined role */}
                          <td className="py-3.5 font-medium text-zinc-300">
                            {user.role}
                          </td>

                          {/* Status */}
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === "joined" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            }`}>
                              {user.status === "joined" ? "Joined" : "Pending Invite"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {user.status === "invited" && (
                                <button
                                  onClick={() => handleCopyLink(user.token)}
                                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedToken === user.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedToken === user.token ? "Copied" : "Copy Invite"}
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  if (confirm(`Revoke permissions and delete ${user.email}?`)) {
                                    deleteUser(user.email);
                                  }
                                }}
                                className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Revoke Access"
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

        {/* ROLE MANAGEMENT TAB */}
        {activeTab === "roles" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Role Definitions</h1>
              <p className="text-xs text-zinc-500 mt-1">Configure workspace roles and assign baseline permissions for automatic profile loading</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Create Role Form */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-md lg:col-span-1">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    Create Custom Role
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Scaffold a new permission category</p>
                </div>

                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Role Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. QA Engineer"
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Role Description
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      placeholder="Brief summary of duties and credentials"
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                  >
                    Add Role Template
                  </button>

                  {roleSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-[10px] text-center font-medium animate-fade-in">
                      Role generated! Toggle its tool maps in the Rule Book.
                    </div>
                  )}
                </form>
              </div>

              {/* Roles Directory Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Role Catalogs ({roles.length})
                  </h3>
                  <span className="text-[10px] text-zinc-500">Each role acts as a baseline credential template</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roles.map((role) => (
                    <div 
                      key={role.id}
                      className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-md group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-zinc-200">{role.name}</h4>
                          {/* Don't allow deleting core templates unless custom */}
                          {!["admin", "developer", "designer", "pm"].includes(role.id) && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete role "${role.name}"? Users with this role will lose their templates.`)) {
                                  deleteRole(role.id);
                                }
                              }}
                              className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed min-h-[40px]">
                          {role.description}
                        </p>
                      </div>

                      {/* Tools mapped to this role */}
                      <div className="border-t border-zinc-800/60 pt-4 mt-4 space-y-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                          Granted Access ({role.allowedTools.length})
                        </span>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {role.allowedTools.length === 0 ? (
                            <span className="text-[10px] text-zinc-600 font-mono italic">No tool integrations mapped</span>
                          ) : (
                            role.allowedTools.map((toolId) => {
                              const tool = tools.find((t) => t.id === toolId);
                              return tool ? (
                                <span 
                                  key={toolId}
                                  className="inline-flex items-center gap-1 bg-zinc-950 border border-zinc-850 px-2 py-1 rounded text-[10px] font-semibold text-zinc-400"
                                >
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

        {/* ACCESS RULE BOOK TAB */}
        {activeTab === "access" && (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Access Mapping (Rule Book)</h1>
                <p className="text-xs text-zinc-500 mt-1">Cross-reference role-to-tool permissions. Toggles update all active user dashboards instantly</p>
              </div>
            </div>

            {/* Matrix Notice */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-300 leading-relaxed">
                <span className="font-bold">Real-time Synchronization:</span> The onboarding agent enforces these rules dynamically. When a new joiner accepts their invite, their profile checks this matrix. Toggling a privilege here immediately adjusts dashboard access for all past and future users matching that role.
              </div>
            </div>

            {/* Rule Book Matrix Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800">
                    <tr>
                      <th className="p-6 font-bold text-zinc-400 text-xs w-48">Roles</th>
                      {tools.map((tool) => (
                        <th key={tool.id} className="p-6 font-bold text-center border-l border-zinc-800/60 min-w-[120px]">
                          <div className="flex flex-col items-center gap-1.5 mx-auto">
                            <div className={`p-1.5 rounded-lg bg-linear-to-br ${tool.color} shrink-0`}>
                              {getToolIcon(tool.iconName)}
                            </div>
                            <span className="text-zinc-200 font-bold">{tool.name}</span>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">{tool.category}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-zinc-950/20 transition-colors">
                        {/* Role details */}
                        <td className="p-6">
                          <p className="font-bold text-sm text-zinc-200">{role.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed max-w-[200px] line-clamp-2">
                            {role.description}
                          </p>
                        </td>

                        {/* Tool mappings */}
                        {tools.map((tool) => {
                          const isAllowed = role.allowedTools.includes(tool.id);
                          return (
                            <td key={tool.id} className="p-6 text-center border-l border-zinc-800/60">
                              <label className="relative inline-flex items-center justify-center cursor-pointer group select-none">
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  onChange={(e) => updateAccessMatrix(role.id, tool.id, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                              </label>
                              <div className="mt-1.5">
                                <span className={`text-[9px] font-bold ${
                                  isAllowed ? "text-indigo-400" : "text-zinc-600"
                                }`}>
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
