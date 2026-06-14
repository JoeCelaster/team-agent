"use client";

import React, { useState } from "react";
import { X, Loader2, MapPin, CheckCircle2, Clock, Circle } from "lucide-react";
import type { AccessRow, Session } from "@/lib/types";

type RoadmapItem = {
  day: string;
  title: string;
  description: string;
  tools: string[];
  status: "done" | "in-progress" | "upcoming";
};

type Props = {
  session: Session;
  rows: AccessRow[];
  onClose: () => void;
};

export function RoadmapPanel({ session, rows, onClose }: Props) {
  const [roadmap, setRoadmap] = useState<RoadmapItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const accessSummary = rows.map((r) => ({
        tool: r.resource_name,
        type: r.access_type,
        status: r.access_status,
      }));

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a first-week onboarding roadmap for me as a ${session.role_name}.
My access status: ${JSON.stringify(accessSummary)}
Return a JSON array (and ONLY the JSON, no other text) with this exact structure:
[{"day":"Day 1","title":"...","description":"...","tools":["Tool A","Tool B"],"status":"done"|"in-progress"|"upcoming"}]
Make it 5 items covering Day 1, Days 2-3, Days 4-5, Week 2, Week 3-4. Base tool mentions on my actual access list above.`,
            },
          ],
          employee_id: session.id,
          role_id: session.role_id,
          org_id: session.org_id,
        }),
      });

      const data = await res.json();
      const raw = data.message ?? "";

      // Extract JSON array from the response
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Could not parse roadmap JSON");
      setRoadmap(JSON.parse(match[0]) as RoadmapItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: RoadmapItem["status"] }) => {
    if (status === "done") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === "in-progress") return <Clock className="w-4 h-4 text-amber-400" />;
    return <Circle className="w-4 h-4 text-faint" />;
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="animate-rise-in flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              Your onboarding roadmap
            </h2>
            <p className="mt-0.5 text-xs text-subtle">AI-generated first-week plan for {session.role_name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!roadmap && !loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
                <MapPin className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Generate your personalised plan</p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-subtle">
                  The assistant analyses your role, granted tools, and pending access to build a day-by-day onboarding plan.
                </p>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={generate}
                className="rounded-md bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Generate roadmap
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-subtle">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <p className="text-xs">Generating your personalised roadmap…</p>
            </div>
          )}

          {roadmap && (
            <div className="space-y-3">
              {roadmap.map((item, i) => (
                <div
                  key={i}
                  className={`flex gap-4 rounded-lg border p-4 ${
                    item.status === "done"
                      ? "border-emerald-500/15 bg-emerald-500/[0.06]"
                      : item.status === "in-progress"
                      ? "border-amber-500/15 bg-amber-500/[0.06]"
                      : "border-border bg-inset/50"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <StatusIcon status={item.status} />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <span className="text-2xs font-semibold uppercase tracking-widest text-faint">{item.day}</span>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs leading-relaxed text-subtle">{item.description}</p>
                    {item.tools?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tools.map((t) => (
                          <span
                            key={t}
                            className="rounded border border-border bg-surface-2 px-2 py-0.5 text-2xs font-medium text-muted"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={generate}
                className="w-full py-2 text-xs text-subtle transition-colors hover:text-foreground"
              >
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
