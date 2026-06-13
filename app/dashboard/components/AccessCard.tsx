"use client";

import React, { useState } from "react";
import { ExternalLink, Clock, CheckCircle2, XCircle, Circle, Loader2 } from "lucide-react";
import type { AccessRow, Session } from "@/lib/types";

type Props = {
  row: AccessRow;
  session: Session;
  onRequested: () => void;
};

const STATUS_CONFIG = {
  not_requested: {
    label: "Not Requested",
    pill: "bg-zinc-800/80 text-zinc-500 border-zinc-700/60",
    Icon: Circle,
  },
  pending: {
    label: "Pending",
    pill: "bg-amber-500/8 text-amber-400 border-amber-500/20",
    Icon: Clock,
  },
  granted: {
    label: "Active",
    pill: "bg-emerald-500/8 text-emerald-400 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  denied: {
    label: "Denied",
    pill: "bg-red-500/8 text-red-400 border-red-500/20",
    Icon: XCircle,
  },
} as const;

function daysRemaining(requestedAt: string | null, avgDays: number) {
  if (!requestedAt) return avgDays;
  const elapsed = (Date.now() - new Date(requestedAt).getTime()) / 86_400_000;
  return Math.max(0, Math.round(avgDays - elapsed));
}

export function AccessCard({ row, session, onRequested }: Props) {
  const [loading, setLoading]       = useState(false);
  const [localStatus, setLocalStatus] = useState(row.access_status);

  const cfg    = STATUS_CONFIG[localStatus];
  const Icon   = cfg.Icon;
  const days   = daysRemaining(row.requested_at, row.avg_provisioning_days);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id:     session.id,
          resource_id:     row.resource_id,
          requested_by:    "employee",
          is_role_relevant: true,
          employee_note:   "Requested from dashboard",
        }),
      });
      if (res.ok) { setLocalStatus("pending"); onRequested(); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-rise-in group bg-[var(--surface)] border border-zinc-800/60 hover:border-zinc-700/70 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 ease-out">

      {/* Tool name + status pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <h4 className="text-[13px] font-bold text-zinc-100 truncate leading-snug">{row.resource_name}</h4>
          {row.description && (
            <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{row.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold shrink-0 ${cfg.pill}`}>
          <Icon className="w-2.5 h-2.5" />
          {cfg.label}
        </span>
      </div>

      {/* Pending ETA */}
      {localStatus === "pending" && row.avg_provisioning_days > 0 && (
        <p className="text-[11px] text-amber-400/70 leading-snug">
          ~{days} day{days !== 1 ? "s" : ""} remaining
          {row.escalation_contact && (
            <span className="text-zinc-600"> · {row.escalation_contact}</span>
          )}
        </p>
      )}

      {/* Action row */}
      <div className="mt-auto pt-3 border-t border-zinc-800/40">
        {(localStatus === "not_requested" || localStatus === "denied") && (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-2 text-[11px] font-semibold transition-all duration-200 ease-out"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Request Access
          </button>
        )}
        {localStatus === "granted" && row.access_link && (
          <a
            href={row.access_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 w-full bg-emerald-500/8 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-xl py-2 text-[11px] font-semibold transition-all"
          >
            Open {row.resource_name}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {localStatus === "granted" && !row.access_link && (
          <p className="text-center text-[11px] text-emerald-400/60 font-medium">Access granted</p>
        )}
        {localStatus === "pending" && (
          <p className="text-center text-[11px] text-zinc-500 font-medium">Awaiting admin approval</p>
        )}
      </div>
    </div>
  );
}
