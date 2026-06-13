"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FlaskConical, Mail, ExternalLink, X } from "lucide-react";
import { useApp } from "@/app/context/AppContext";

// Routes that are the "real product" or full-screen flows: the demo launcher
// must never overlay these (this is what was covering the dashboard chat).
const HIDDEN_PREFIXES = ["/dashboard", "/login", "/sim", "/invite"];

export function SimLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const { emails } = useApp();
  const [toast, setToast] = useState<{ to: string; token: string } | null>(null);

  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname?.startsWith(`${p}/`)
  );

  // Surface a brief, calm toast when a fresh invite email is simulated.
  useEffect(() => {
    const latest = emails[0];
    if (!latest) return;
    if (Date.now() - new Date(latest.sentAt).getTime() > 5000) return;

    setToast({ to: latest.to, token: latest.token });
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [emails]);

  if (hidden) return null;

  const unread = emails.some((e) => !e.read);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3 font-sans">
      {toast && (
        <div className="animate-toast-in w-72 rounded-xl border border-indigo-500/40 bg-[var(--surface)] p-3.5 shadow-2xl shadow-indigo-950/40">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">Invite email sent</p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">To: {toast.to}</p>
              <button
                onClick={() => {
                  router.push(`/invite/${toast.token}`);
                  setToast(null);
                }}
                className="group mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Open onboarding flow
                <ExternalLink className="h-3 w-3 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </button>
            </div>
            <button
              onClick={() => setToast(null)}
              className="-m-1 rounded-md p-1 text-zinc-600 transition-colors hover:text-zinc-300"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <Link
        href="/sim"
        className="group inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[var(--surface)]/90 py-2 pl-3 pr-3.5 text-xs font-medium text-zinc-400 shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-indigo-500/40 hover:text-zinc-100"
      >
        <span className="relative inline-flex">
          <FlaskConical className="h-3.5 w-3.5 text-indigo-400" />
          {unread && (
            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-[var(--surface)]" />
          )}
        </span>
        Demo controls
      </Link>
    </div>
  );
}
