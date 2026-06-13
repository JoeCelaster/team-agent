"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox, Loader2 } from "lucide-react";
import { RequestRow } from "./components/RequestRow";
import type { AdminRequestRow, Session } from "@/lib/types";

export default function AdminQueuePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<AdminRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("onboard-session");
    if (!raw) { router.replace("/login"); return; }
    const s = JSON.parse(raw) as Session;
    if (!s.is_admin) { router.replace("/dashboard"); return; }
    setSession(s);
  }, [router]);

  const fetchQueue = useCallback(async (orgId: string) => {
    const res = await fetch(`/api/admin/queue?org_id=${orgId}`);
    if (res.ok) setRows(await res.json());
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetchQueue(session.org_id).finally(() => setLoading(false));
  }, [session, fetchQueue]);

  if (!session || loading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-zinc-100 font-sans">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[var(--canvas)]/85 backdrop-blur-md px-6 py-3.5 flex items-center gap-4">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
        <h1 className="text-sm font-bold text-zinc-100">Approval Queue</h1>
        <span className="ml-auto text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold">
          {rows.length} pending
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600 text-sm gap-3">
            <Inbox className="w-10 h-10 stroke-[1.5]" />
            <p className="font-semibold">Queue is empty</p>
            <p className="text-xs text-zinc-700">All access requests have been reviewed.</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Note</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <RequestRow
                    key={row.request_id}
                    row={row}
                    session={session}
                    onAction={() => fetchQueue(session.org_id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
