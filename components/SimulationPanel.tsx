"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";
import { 
  Mail, 
  Settings, 
  User, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Info
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function SimulationPanel() {
  const { emails, resetDatabase, users } = useApp();
  const [isOpen, setIsOpen] = useState(true);
  const [newEmailNotification, setNewEmailNotification] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Track if a new email was sent
  useEffect(() => {
    if (emails.length > 0) {
      const latestEmail = emails[0];
      // If it was sent in the last 5 seconds
      const sentTime = new Date(latestEmail.sentAt).getTime();
      if (Date.now() - sentTime < 5000) {
        setNewEmailNotification(latestEmail.to);
        const timer = setTimeout(() => {
          setNewEmailNotification(null);
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [emails]);

  const activeInvite = emails[0]; // get latest invite for quick click

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full font-sans transition-all duration-300 ease-in-out">
      {/* Toast Notification for sent email */}
      {newEmailNotification && (
        <div className="mb-3 bg-zinc-900 border border-indigo-500/50 rounded-xl p-4 shadow-2xl shadow-indigo-950/30 animate-bounce text-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-100">Invite Email Sent!</p>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">To: {newEmailNotification}</p>
              <button 
                onClick={() => {
                  if (activeInvite) {
                    router.push(`/invite/${activeInvite.token}`);
                    setNewEmailNotification(null);
                  }
                }}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group"
              >
                Go to Onboarding Flow
                <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-xs uppercase tracking-wider text-zinc-300">
              Simulation Controller
            </span>
          </div>
          <button className="text-zinc-500 hover:text-zinc-300">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        {isOpen && (
          <div className="p-4 border-t border-zinc-800/60 flex flex-col gap-4 text-sm bg-zinc-950/20">
            <div className="bg-zinc-900 border border-zinc-800/60 p-3 rounded-xl text-xs text-zinc-400 space-y-1">
              <p className="font-medium text-zinc-300 flex items-center gap-1.5 mb-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                How to test the workflow:
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Go to the <span className="text-zinc-200">Admin Console</span>.</li>
                <li>Go to <span className="text-zinc-200">Users</span> and fill out the invite form.</li>
                <li>An email is simulated instantly! Open the <span className="text-indigo-400 font-medium">Inbox</span> tab here or click the popup.</li>
                <li>Accept the invite, log in, and view the pre-assigned role dashboard.</li>
              </ol>
            </div>

            {/* Navigation Persona Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => router.push("/")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  pathname === "/" || pathname?.startsWith("/admin")
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100"
                    : "bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Admin Console
              </button>

              <button
                onClick={() => router.push("/inbox")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  pathname === "/inbox"
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <div className="relative">
                  <Mail className="w-3.5 h-3.5" />
                  {emails.some(e => !e.read) && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>
                Inbox ({emails.length})
              </button>
            </div>

            {/* Quick Access to Last Invited User */}
            {emails.length > 0 && (
              <div className="border-t border-zinc-800/60 pt-3">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Latest Invitation Link</p>
                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800/80 rounded-xl p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200 truncate">{emails[0].to}</p>
                    <p className="text-[10px] text-zinc-500 truncate">Role: {users.find(u => u.email === emails[0].to)?.role || "Unknown"}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/invite/${emails[0].token}`)}
                    className="ml-2 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0"
                  >
                    Accept
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Reset State */}
            <div className="border-t border-zinc-800/60 pt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Reset prototype database:</span>
              <button
                onClick={() => {
                  if (confirm("Reset all roles, users, and simulator invitations back to defaults?")) {
                    resetDatabase();
                    router.push("/");
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
