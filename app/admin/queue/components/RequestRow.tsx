"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Bot, User, AlertTriangle, Loader2 } from "lucide-react";
import type { AdminRequestRow, Session } from "@/lib/types";

type Props = {
  row: AdminRequestRow;
  session: Session;
  onAction: () => void;
};

export function RequestRow({ row, session, onAction }: Props) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);

  const act = async (action: "approve" | "deny") => {
    setLoading(action);
    try {
      await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: row.request_id, reviewer_id: session.id }),
      });
      onAction();
    } finally {
      setLoading(null);
    }
  };

  return (
    <tr className="border-b border-border/60 transition-colors hover:bg-surface-2/40">
      {/* Employee */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold text-muted">
            {row.employee_name[0]}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{row.employee_name}</p>
            <p className="text-2xs text-subtle">{row.role_name}</p>
          </div>
        </div>
      </td>

      {/* Resource */}
      <td className="px-4 py-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">{row.resource_name}</p>
          {!row.is_role_relevant && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-2xs font-semibold text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              Not standard for this role
            </span>
          )}
        </div>
      </td>

      {/* Source */}
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-muted">
          {row.requested_by === "agent" ? (
            <><Bot className="h-3 w-3 text-accent" /> Agent</>
          ) : (
            <><User className="h-3 w-3 text-subtle" /> Employee</>
          )}
        </span>
      </td>

      {/* Note */}
      <td className="max-w-[200px] px-4 py-4">
        <p className="line-clamp-2 text-xs text-subtle">{row.employee_note ?? "—"}</p>
      </td>

      {/* Requested at */}
      <td className="px-4 py-4">
        <p className="font-data text-xs text-subtle">
          {new Date(row.requested_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => act("approve")}
            disabled={!!loading}
            className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-2xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {loading === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Approve
          </button>
          <button
            onClick={() => act("deny")}
            disabled={!!loading}
            className="flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-2xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {loading === "deny" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Deny
          </button>
        </div>
      </td>
    </tr>
  );
}
