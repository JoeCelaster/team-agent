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
    <div className="min-h-screen bg-canvas text-foreground px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-10 animate-fade-in">
        <header className="space-y-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
            Back to product
          </Link>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-2xs font-semibold uppercase tracking-widest text-faint">
              Demo Control Room
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Drive the onboarding simulation
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-subtle">
            These controls live off the main flow, so they never sit on top of the product.
            Step through the invite lifecycle, then jump into the real dashboards.
          </p>
        </header>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-2xs font-semibold uppercase tracking-widest text-faint">
            How the workflow runs
          </h2>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted">
                <span className="font-data mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong text-2xs font-semibold text-subtle">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Destinations */}
        <section className="space-y-4">
          <h2 className="text-2xs font-semibold uppercase tracking-widest text-faint">
            Jump to a surface
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DESTINATIONS.map(({ href, label, hint, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-200 ease-out hover:border-accent/40 hover:bg-surface-2"
              >
                <span className="rounded-md bg-inset p-2 text-accent transition-colors group-hover:bg-accent/10">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-subtle">{hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest invite + reset */}
        <section className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          {latest ? (
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-widest text-faint">
                Latest invitation
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{latest.to}</p>
                  <p className="text-xs text-subtle">
                    {users.find((u) => u.email === latest.to)?.role ?? "Unknown role"}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/invite/${latest.token}`)}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                >
                  Accept invite
                  <ExternalLink className="h-3 w-3 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-subtle">No invitations simulated yet.</p>
          )}

          <button
            onClick={() => {
              if (confirm("Reset all roles, users, and simulated invitations back to defaults?")) {
                resetDatabase();
                router.refresh();
              }
            }}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo data
          </button>
        </section>
      </div>
    </div>
  );
}
