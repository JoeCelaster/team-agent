"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Mail,
  Sparkles,
  LogIn,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";

const STEPS = [
  "Open the Admin Console and add an invite under Users.",
  "An invite email is simulated instantly. Find it in the Inbox.",
  "Accept the invite, then sign in to see the pre-assigned role dashboard.",
  "Use the AI assistant on the dashboard to request tool access.",
];

const DESTINATIONS = [
  {
    href: "/console",
    label: "Admin Console",
    hint: "Configure org, roles, and the access rule book",
    Icon: Settings,
  },
  {
    href: "/inbox",
    label: "Simulated Inbox",
    hint: "Read the onboarding emails the console sends",
    Icon: Mail,
  },
  {
    href: "/ai",
    label: "AI Provider Lab",
    hint: "Watch the multi-provider failover stream live",
    Icon: Sparkles,
  },
  {
    href: "/login",
    label: "Product Sign-In",
    hint: "Enter the real employee / admin experience",
    Icon: LogIn,
  },
];

export default function SimControlRoom() {
  const router = useRouter();
  const { emails, users, resetDatabase } = useApp();
  const latest = emails[0];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-zinc-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
            Back to product
          </Link>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Demo Control Room
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Drive the onboarding simulation
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            These controls live off the main flow, so they never sit on top of the product.
            Step through the invite lifecycle, then jump into the real dashboards.
          </p>
        </header>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            How the workflow runs
          </h2>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[11px] font-semibold text-zinc-400">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Destinations */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Jump to a surface
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DESTINATIONS.map(({ href, label, hint, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-2xl border border-zinc-800 bg-[var(--surface)] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-indigo-500/40"
              >
                <span className="rounded-lg bg-zinc-900 p-2 text-indigo-400 transition-colors group-hover:bg-indigo-500/10">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-100">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest invite + reset */}
        <section className="flex flex-col gap-4 border-t border-zinc-800/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          {latest ? (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Latest invitation
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{latest.to}</p>
                  <p className="text-xs text-zinc-500">
                    {users.find((u) => u.email === latest.to)?.role ?? "Unknown role"}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/invite/${latest.token}`)}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
                >
                  Accept invite
                  <ExternalLink className="h-3 w-3 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No invitations simulated yet.</p>
          )}

          <button
            onClick={() => {
              if (confirm("Reset all roles, users, and simulated invitations back to defaults?")) {
                resetDatabase();
                router.refresh();
              }
            }}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo data
          </button>
        </section>
      </div>
    </div>
  );
}
