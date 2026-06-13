"use client";

import React, { useState } from "react";
import { ExternalLink, Clock, CheckCircle2, XCircle, Circle, Loader2 } from "lucide-react";
import type { AccessRow, Session } from "@/lib/types";

type Props = {
  row: AccessRow;
  session: Session;
  onRequested: () => void;
};

const STATUS_PILL = {
  not_requested: {
    label: "Not Requested",
    cls: "bg-zinc-800 text-zinc-400 border-zinc-700",
    Icon: Circle,
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Icon: Clock,
  },
  granted: {
    label: "Active",
    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  denied: {
    label: "Denied",
    cls: "bg-red-500/10 text-red-400 border-red-500/20",
    Icon: XCircle,
  },
};

function daysRemaining(requestedAt: string | null, avgDays: number) {
  if (!requestedAt) return avgDays;
  const elapsed = (Date.now() - new Date(requestedAt).getTime()) / 86400000;
  return Math.max(0, Math.round(avgDays - elapsed));
}

export function AccessCard({ row, session, onRequested }: Props) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(row.access_status);

  const pill = STATUS_PILL[localStatus];
  const PillIcon = pill.Icon;

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: session.id,
          resource_id: row.resource_id,
          requested_by: "employee",
          is_role_relevant: row.access_type !== "common" ? true : true,
          employee_note: "Requested from dashboard",
        }),
      });
      if (res.ok) {
        setLocalStatus("pending");
        onRequested();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-rise-in bg-[var(--surface)] border border-zinc-800/60 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 ease-out hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-bold text-zinc-100 truncate">{row.resource_name}</h4>
          {row.description && (
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{row.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold shrink-0 ${pill.cls}`}>
          <PillIcon className="w-3 h-3" />
          {pill.label}
        </span>
      </div>

      {localStatus === "pending" && row.avg_provisioning_days > 0 && (
        <p className="text-[11px] text-amber-400/80">
          ~{daysRemaining(row.requested_at, row.avg_provisioning_days)} day{daysRemaining(row.requested_at, row.avg_provisioning_days) !== 1 ? "s" : ""} remaining
          {row.escalation_contact && (
            <span className="text-zinc-500"> · Escalate: {row.escalation_contact}</span>
          )}
        </p>
      )}

      <div className="mt-auto pt-3 border-t border-zinc-800/50 flex items-center gap-2">
        {(localStatus === "not_requested" || localStatus === "denied") && (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl py-2 text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.99]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Request Access
          </button>
        )}
        {localStatus === "granted" && row.access_link && (
          <a
            href={row.access_link}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl py-2 text-xs font-semibold transition-all"
          >
            Open {row.resource_name}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {localStatus === "pending" && (
          <span className="flex-1 text-center text-xs text-zinc-500 font-medium">Awaiting admin approval</span>
        )}
      </div>
    </div>
  );
}
