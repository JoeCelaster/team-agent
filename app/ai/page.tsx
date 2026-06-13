"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, Sparkles, Server, ShieldAlert, CircleDot } from "lucide-react";

type ProviderSnapshot = {
  id: string;
  label: string;
  baseURL: string;
  model: string;
  priority: number;
  available: boolean;
  cooldownRemainingMs: number;
  consecutiveFailures: number;
  lastError?: string;
};

type ProvidersResponse = {
  configured: number;
  available: number;
  providers: ProviderSnapshot[];
};

function formatMs(ms: number) {
  if (ms <= 0) {
    return "ready";
  }

  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}

export default function AILabPage() {
  const [providers, setProviders] = useState<ProviderSnapshot[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [prompt, setPrompt] = useState("Give me a concise rollout plan for a multi-provider AI fallback architecture.");
  const [system, setSystem] = useState("You are a concise engineering assistant.");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const summary = useMemo(() => {
    const ready = providers.filter((provider) => provider.available).length;
    return `${ready}/${providers.length} ready`;
  }, [providers]);

  const refreshProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await fetch("/api/ai/providers", { cache: "no-store" });
      const data = (await response.json()) as ProvidersResponse;
      setProviders(data.providers ?? []);
    } catch {
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialProviders = async () => {
      try {
        const response = await fetch("/api/ai/providers", { cache: "no-store" });
        const data = (await response.json()) as ProvidersResponse;

        if (!cancelled) {
          setProviders(data.providers ?? []);
        }
      } catch {
        if (!cancelled) {
          setProviders([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingProviders(false);
        }
      }
    };

    void loadInitialProviders();

    return () => {
      cancelled = true;
    };
  }, []);

  const runPrompt = async () => {
    setIsRunning(true);
    setOutput("");
    setStatus(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.text();
        setStatus(errorBody || `Request failed with HTTP ${response.status}`);
        return;
      }

      const providerId = response.headers.get("x-ai-provider-id");
      setStatus(providerId ? `Using ${providerId}` : "Streaming response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        setOutput((current) => current + decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unknown request error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-zinc-100 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI Provider Lab
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Multi-provider fallback demo</h1>
              <p className="mt-2 text-sm text-zinc-400">
                This page calls <span className="text-zinc-200">/api/ai/chat</span>, shows the live provider pool, and streams the response from the first healthy backend.
              </p>
            </div>
          </div>

          <button
            onClick={() => void refreshProviders()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-zinc-200 transition-all duration-200 ease-out hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.99]"
          >
            <RefreshCw className={`h-4 w-4 ${loadingProviders ? "animate-spin" : ""}`} />
            Refresh Pool
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-zinc-800 bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold">Playground</h2>
                <p className="text-xs text-zinc-500">Send a prompt and watch failover headers update in the response.</p>
              </div>
              <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
                {summary}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">System</label>
              <textarea
                value={system}
                onChange={(event) => setSystem(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-800 bg-[var(--canvas)] px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500"
              />

              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Prompt</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-zinc-800 bg-[var(--canvas)] px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500"
              />

              <button
                onClick={() => void runPrompt()}
                disabled={isRunning || !prompt.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 ease-out hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? "Running" : "Run prompt"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-[var(--canvas)] p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                <span>Stream output</span>
                {status && <span>{status}</span>}
              </div>
              <pre className="min-h-56 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-zinc-200">
                {output || "Output will stream here."}
              </pre>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                <Server className="h-4 w-4 text-indigo-400" />
                <h2 className="text-lg font-bold">Provider Pool</h2>
              </div>

              <div className="mt-4 space-y-3">
                {providers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
                    No providers are configured yet. Add an env-backed provider pool entry and refresh.
                  </div>
                ) : (
                  providers.map((provider) => (
                    <div key={provider.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-zinc-100">{provider.label}</h3>
                            {provider.available ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                                <CircleDot className="h-3 w-3" />
                                Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                                <ShieldAlert className="h-3 w-3" />
                                Cooldown
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {provider.model} · priority {provider.priority}
                          </p>
                        </div>
                        <div className="text-right text-[11px] text-zinc-500">
                          <div>{provider.available ? "ready" : formatMs(provider.cooldownRemainingMs)}</div>
                          <div>{provider.consecutiveFailures} failures</div>
                        </div>
                      </div>
                      <p className="mt-3 break-all text-[11px] text-zinc-600">{provider.baseURL}</p>
                      {provider.lastError && <p className="mt-2 text-xs text-rose-300">{provider.lastError}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}