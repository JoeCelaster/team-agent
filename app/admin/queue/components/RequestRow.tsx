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
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
      {/* Employee */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
            {row.employee_name[0]}
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-200">{row.employee_name}</p>
            <p className="text-[10px] text-zinc-500">{row.role_name}</p>
          </div>
        </div>
      </td>

      {/* Resource */}
      <td className="py-4 px-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-200">{row.resource_name}</p>
          {!row.is_role_relevant && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-2.5 h-2.5" />
              Not standard for this role
            </span>
          )}
        </div>
      </td>

      {/* Source */}
      <td className="py-4 px-4">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
          {row.requested_by === "agent" ? (
            <><Bot className="w-3 h-3 text-indigo-400" /> Agent</>
          ) : (
            <><User className="w-3 h-3 text-zinc-400" /> Employee</>
          )}
        </span>
      </td>

      {/* Note */}
      <td className="py-4 px-4 max-w-[200px]">
        <p className="text-[11px] text-zinc-500 line-clamp-2">{row.employee_note ?? "—"}</p>
      </td>

      {/* Requested at */}
      <td className="py-4 px-4">
        <p className="text-[11px] text-zinc-500">
          {new Date(row.requested_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </td>

      {/* Actions */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => act("approve")}
            disabled={!!loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all disabled:opacity-50"
          >
            {loading === "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Approve
          </button>
          <button
            onClick={() => act("deny")}
            disabled={!!loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all disabled:opacity-50"
          >
            {loading === "deny" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Deny
          </button>
        </div>
      </td>
    </tr>
  );
}
