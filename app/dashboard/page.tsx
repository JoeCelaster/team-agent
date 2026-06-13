"use client";

import React, { useEffect } from "react";
import { useApp } from "@/app/context/AppContext";
import { 
  Laptop, 
  LogOut, 
  ArrowUpRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Lock,
  User as UserIcon,
  Smile
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

export default function UserDashboardPage() {
  const { currentUser, setCurrentUser, roles, tools, org } = useApp();
  const router = useRouter();

  // If no user is logged in, default to the admin or first joined user for simulation
  useEffect(() => {
    if (!currentUser) {
      // Find the first joined user in our mock database
      const joinedUser = typeof window !== "undefined" 
        ? JSON.parse(localStorage.getItem("team_agent_users") || "[]").find((u: any) => u.status === "joined")
        : null;
      if (joinedUser) {
        setCurrentUser(joinedUser);
      }
    }
  }, [currentUser, setCurrentUser]);

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-950 p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-100">Session Required</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No user is currently authenticated. Please accept an email invitation from the simulated inbox to view this dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/inbox")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              Go to Inbox Simulator
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              Go to Admin Console
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find user's role definition
  const userRole = roles.find(
    (r) => r.name.toLowerCase() === currentUser.role.toLowerCase() || r.id === currentUser.role.toLowerCase()
  );

  // Find tools mapped to this role
  const allowedTools = tools.filter((tool) => userRole?.allowedTools.includes(tool.id));

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  // Get matching tool icon
  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "Github": return <GithubIcon className="w-6 h-6 text-zinc-350" />;
      case "Slack": return <SlackIcon className="w-6 h-6 text-purple-400" />;
      case "BookOpen": return <NotionIcon className="w-6 h-6 text-amber-500" />;
      case "HardDrive": return <GoogleDriveIcon className="w-6 h-6 text-blue-450" />;
      case "Figma": return <FigmaIcon className="w-6 h-6 text-rose-500" />;
      case "CheckSquare": return <LinearIcon className="w-6 h-6 text-indigo-400" />;
      default: return <Laptop className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
            {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-zinc-200">{currentUser.name || "Employee"}</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{currentUser.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-950/40 via-indigo-900/10 to-zinc-900 border border-indigo-500/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Building2 className="w-32 h-32 text-indigo-500" />
          </div>
          <div className="relative z-10 space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Account Active
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
              Welcome to the Workspace, {currentUser.name?.split(" ")[0]}! <Smile className="w-6 h-6 text-indigo-400" />
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Your administrator has fully configured your credentials. Below you'll find the corporate tools and resources pre-allocated for your role as a <span className="text-zinc-200 font-semibold">{currentUser.role}</span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Profile Details (Left) */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Access Profile</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" /> Full Name
                </span>
                <p className="text-sm font-semibold text-zinc-200">{currentUser.name || "N/A"}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Email Address
                </span>
                <p className="text-sm font-semibold text-zinc-200 truncate">{currentUser.email}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Organization
                </span>
                <p className="text-sm font-semibold text-zinc-200">{org.name} ({org.domain})</p>
              </div>
            </div>

            <div className="border-t border-zinc-800/60 pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Security Clearance</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Pre-assigned Role</span>
                <span className="text-zinc-300 font-medium">{currentUser.role}</span>
              </div>
            </div>
          </div>

          {/* Accessible Tools list (Right) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                My Workspace Tools ({allowedTools.length})
              </h3>
              <span className="text-[10px] text-zinc-500">Controlled by administrator rules</span>
            </div>

            {allowedTools.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                <ShieldAlert className="w-10 h-10 text-zinc-700 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold">No Tools Assigned</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Your role has no default software privileges assigned. Please contact your IT administrator.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allowedTools.map((tool) => (
                  <div 
                    key={tool.id} 
                    className="bg-zinc-900 border border-zinc-800/60 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/5 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl bg-linear-to-br ${tool.color} shadow-lg shadow-black/10`}>
                          {getToolIcon(tool.iconName)}
                        </div>
                        <span className="text-[10px] font-bold text-indigo-400/80 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                          {tool.category}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-200 group-hover:text-zinc-100 transition-colors">
                          {tool.name}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed min-h-[48px]">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/50 mt-4">
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-indigo-600 border border-zinc-850 hover:border-indigo-500 text-zinc-400 hover:text-white py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group/btn"
                      >
                        Launch {tool.name}
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
