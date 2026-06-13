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
    return <Circle className="w-4 h-4 text-zinc-600" />;
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="animate-rise-in w-full max-w-xl bg-[var(--surface)] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Your Onboarding Roadmap
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">AI-generated first-week plan for {session.role_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!roadmap && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-200">Generate your personalised plan</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  The AI will analyse your role, granted tools, and pending access to create a day-by-day onboarding plan.
                </p>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={generate}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Generate Roadmap
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Generating your personalised roadmap…</p>
            </div>
          )}

          {roadmap && (
            <div className="space-y-4">
              {roadmap.map((item, i) => (
                <div
                  key={i}
                  className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                    item.status === "done"
                      ? "bg-emerald-950/20 border-emerald-500/15"
                      : item.status === "in-progress"
                      ? "bg-amber-950/20 border-amber-500/15"
                      : "bg-zinc-950/40 border-zinc-800/60"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    <StatusIcon status={item.status} />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{item.day}</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-200">{item.title}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{item.description}</p>
                    {item.tools?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tools.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-medium"
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
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
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
