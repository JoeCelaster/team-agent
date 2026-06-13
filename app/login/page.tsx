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
    description: "New joinee — sees his tools, uses the bot",
    avatar: "JS",
    color: "from-indigo-500 to-violet-600",
  },
  {
    label: "Rahul",
    email: "rahul@abccorp.com",
    role: "Admin",
    description: "Org admin — approves / denies requests",
    avatar: "R",
    color: "from-emerald-500 to-teal-600",
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
    <div className="min-h-screen bg-[var(--canvas)] text-zinc-100 font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <Building2 className="w-3.5 h-3.5" />
            AuraOnboard
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-zinc-400">Sign in with your company email to access your workspace</p>
        </div>

        {/* Email input */}
        <div className="bg-[var(--surface)] border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email && loginAs(email)}
              placeholder="you@company.com"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>
          <button
            onClick={() => email && loginAs(email)}
            disabled={!email || loading === email}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-all duration-200 ease-out active:scale-[0.99]"
          >
            {loading === email ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Sign In
          </button>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>

        {/* Demo selector */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">
            — Demo accounts —
          </p>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => loginAs(account.email)}
              disabled={!!loading}
              className="w-full flex items-center gap-4 bg-[var(--surface)] hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99] group disabled:opacity-60"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${account.color} flex items-center justify-center font-bold text-white text-sm shrink-0`}>
                {loading === account.email ? <Loader2 className="w-4 h-4 animate-spin" /> : account.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-zinc-200">{account.label}</p>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-medium">
                    {account.role}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{account.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>All data lives in Supabase — no mocks</span>
        </div>
      </div>
    </div>
  );
}
