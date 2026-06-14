"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import type { Session } from "@/lib/types";

const DEMO_ACCOUNTS = [
  {
    label: "Joe Singh",
    email: "joe@abccorp.com",
    role: "UI Engineer",
    description: "New joiner: sees his tools, uses the assistant",
    avatar: "JS",
    tint: "oklch(0.62 0.19 277)",
  },
  {
    label: "Rahul",
    email: "rahul@abccorp.com",
    role: "Admin",
    description: "Org admin: approves and denies requests",
    avatar: "R",
    tint: "oklch(0.72 0.15 162)",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loginAs = async (loginEmail: string) => {
    setLoading(loginEmail);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      localStorage.setItem("onboard-session", JSON.stringify(data as Session));
      router.push(data.is_admin ? "/admin" : "/dashboard");
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        {/* Brand */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <Building2 className="w-3.5 h-3.5" />
            AuraOnboard
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-subtle">Sign in with your company email to reach your workspace.</p>
          </div>
        </div>

        {/* Email input */}
        <div className="space-y-3">
          <label className="block text-2xs font-semibold uppercase tracking-widest text-faint">
            Work email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && loginAs(email)}
            placeholder="you@company.com"
            className="w-full rounded-md border border-border bg-inset px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
          <button
            onClick={() => email && loginAs(email)}
            disabled={!email || loading === email}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-3 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-accent-hover active:scale-[0.99] disabled:opacity-50"
          >
            {loading === email ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Sign in
          </button>
          {error && <p className="text-center text-xs text-red-400">{error}</p>}
        </div>

        {/* Demo selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <p className="text-2xs font-semibold uppercase tracking-widest text-faint">Demo accounts</p>
            <span className="h-px flex-1 bg-border" />
          </div>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => loginAs(account.email)}
              disabled={!!loading}
              className="group flex w-full items-center gap-3.5 rounded-lg border border-border bg-surface p-3.5 text-left transition-colors duration-200 ease-out hover:border-border-strong hover:bg-surface-2 active:scale-[0.99] disabled:opacity-60"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                style={{ background: account.tint }}
              >
                {loading === account.email ? <Loader2 className="w-4 h-4 animate-spin" /> : account.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{account.label}</p>
                  <span className="rounded border border-border px-1.5 py-0.5 text-2xs font-medium text-muted">
                    {account.role}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-subtle">{account.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-muted" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-faint">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Every record lives in Supabase. No mocks.</span>
        </div>
      </div>
    </div>
  );
}
