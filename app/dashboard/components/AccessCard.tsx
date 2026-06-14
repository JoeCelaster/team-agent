"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, XCircle, Circle, Loader2, ArrowUpRight } from "lucide-react";
import type { AccessRow, Session } from "@/lib/types";

type Props = {
  row: AccessRow;
  session: Session;
  onRequested: () => void;
};

const STATUS_CONFIG = {
  not_requested: { label: "Not requested", dot: "bg-faint",       text: "text-subtle"  },
  pending:       { label: "Pending",       dot: "bg-amber-400",   text: "text-amber-300/90" },
  granted:       { label: "Active",        dot: "bg-emerald-400", text: "text-emerald-300/90" },
  denied:        { label: "Denied",        dot: "bg-red-400",     text: "text-red-300/90" },
} as const;

const STATUS_ICON = {
  not_requested: Circle,
  pending: Clock,
  granted: CheckCircle2,
  denied: XCircle,
} as const;

function daysRemaining(requestedAt: string | null, avgDays: number) {
  if (!requestedAt) return avgDays;
  const elapsed = (Date.now() - new Date(requestedAt).getTime()) / 86_400_000;
  return Math.max(0, Math.round(avgDays - elapsed));
}

export function AccessCard({ row, session, onRequested }: Props) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(row.access_status);

  const cfg = STATUS_CONFIG[localStatus];
  const Icon = STATUS_ICON[localStatus];
  const days = daysRemaining(row.requested_at, row.avg_provisioning_days);

  // Settled states (granted) recede; actionable states (request/denied) lead.
  const actionable = localStatus === "not_requested" || localStatus === "denied";

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: session.id,
          resource_id: row.resource_id,
          role_id: session.role_id,
          requested_by: "employee",
          employee_note: "Requested from dashboard",
        }),
      });
      if (res.ok) {
        const body = await res.json();
        setLocalStatus(body.auto_approved ? "granted" : "pending");
        onRequested();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`animate-rise-in group flex flex-col gap-3 rounded-lg p-4 transition-colors duration-200 ease-out
        ${actionable
          ? "bg-surface border border-border hover:border-border-strong"
          : "border border-border/60 hover:border-border"}`}
    >
      {/* Name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h4 className="truncate text-sm font-semibold leading-snug text-foreground">{row.resource_name}</h4>
          {row.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-subtle">{row.description}</p>
          )}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 text-2xs font-medium ${cfg.text}`}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      {/* Pending ETA */}
      {localStatus === "pending" && row.avg_provisioning_days > 0 && (
        <p className="text-xs leading-snug text-amber-300/70">
          <span className="font-data">~{days}d</span> remaining
          {row.escalation_contact && <span className="text-faint"> · {row.escalation_contact}</span>}
        </p>
      )}

      {/* Action row */}
      <div className="mt-auto pt-1">
        {actionable && (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent py-2 text-xs font-semibold text-white transition-colors duration-200 ease-out hover:bg-accent-hover disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {localStatus === "denied" ? "Request again" : "Request access"}
          </button>
        )}
        {localStatus === "granted" && row.access_link && (
          <a
            href={row.access_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-300/90 transition-colors hover:text-emerald-200"
          >
            Open {row.resource_name}
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
        {localStatus === "granted" && !row.access_link && (
          <p className="text-xs font-medium text-emerald-300/60">Access granted</p>
        )}
        {localStatus === "pending" && (
          <p className="text-xs text-subtle">Awaiting admin approval</p>
        )}
      </div>
    </div>
  );
}
