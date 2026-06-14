"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox } from "lucide-react";
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
      <div className="min-h-screen bg-canvas">
        <div className="h-14 border-b border-border" />
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-foreground font-sans">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-canvas/85 px-6 backdrop-blur-md">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </button>
        <h1 className="text-sm font-semibold text-foreground">Approval queue</h1>
        <span className="ml-auto rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-2xs font-semibold text-amber-400">
          <span className="font-data">{rows.length}</span> pending
        </span>
      </header>

      <main className="mx-auto max-w-5xl animate-fade-in px-6 py-8">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-faint">
            <Inbox className="h-10 w-10 stroke-[1.5]" />
            <p className="font-semibold text-subtle">Queue is empty</p>
            <p className="text-xs">All access requests have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-left">
              <thead className="border-b border-border text-2xs uppercase tracking-wider text-faint">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Employee</th>
                  <th className="px-4 py-3.5 font-semibold">Resource</th>
                  <th className="px-4 py-3.5 font-semibold">Source</th>
                  <th className="px-4 py-3.5 font-semibold">Note</th>
                  <th className="px-4 py-3.5 font-semibold">Date</th>
                  <th className="px-4 py-3.5 font-semibold">Actions</th>
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
