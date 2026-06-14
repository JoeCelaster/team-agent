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
    <div className="min-h-screen bg-canvas text-foreground px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              AI Provider Lab
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Multi-provider fallback demo</h1>
              <p className="mt-2 text-sm text-subtle">
                Calls <span className="font-data text-muted">/api/ai/chat</span>, shows the live provider pool, and streams the response from the first healthy backend.
              </p>
            </div>
          </div>

          <button
            onClick={() => void refreshProviders()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 ease-out hover:border-border-strong hover:bg-surface-2 active:scale-[0.99]"
          >
            <RefreshCw className={`h-4 w-4 ${loadingProviders ? "animate-spin" : ""}`} />
            Refresh pool
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-semibold">Playground</h2>
                <p className="text-xs text-subtle">Send a prompt and watch failover headers update in the response.</p>
              </div>
              <div className="font-data rounded-md border border-border bg-inset px-3 py-1 text-xs text-muted">
                {summary}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-2xs font-semibold uppercase tracking-widest text-faint">System</label>
              <textarea
                value={system}
                onChange={(event) => setSystem(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-inset px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent"
              />

              <label className="block text-2xs font-semibold uppercase tracking-widest text-faint">Prompt</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
                className="w-full rounded-md border border-border bg-inset px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent"
              />

              <button
                onClick={() => void runPrompt()}
                disabled={isRunning || !prompt.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? "Running" : "Run prompt"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-md border border-border bg-inset p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-subtle">
                <span>Stream output</span>
                {status && <span className="font-data text-faint">{status}</span>}
              </div>
              <pre className="min-h-56 whitespace-pre-wrap wrap-break-word font-data text-sm leading-6 text-muted">
                {output || "Output will stream here."}
              </pre>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Server className="h-4 w-4 text-accent" />
                <h2 className="text-lg font-semibold">Provider pool</h2>
              </div>

              <div className="mt-4 space-y-3">
                {providers.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-inset p-4 text-sm text-subtle">
                    No providers are configured yet. Add an env-backed provider pool entry and refresh.
                  </div>
                ) : (
                  providers.map((provider) => (
                    <div key={provider.id} className="rounded-lg border border-border bg-inset p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{provider.label}</h3>
                            {provider.available ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-emerald-300">
                                <CircleDot className="h-3 w-3" />
                                Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-amber-300">
                                <ShieldAlert className="h-3 w-3" />
                                Cooldown
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-subtle">
                            <span className="font-data">{provider.model}</span> · priority {provider.priority}
                          </p>
                        </div>
                        <div className="font-data text-right text-2xs text-subtle">
                          <div>{provider.available ? "ready" : formatMs(provider.cooldownRemainingMs)}</div>
                          <div>{provider.consecutiveFailures} failures</div>
                        </div>
                      </div>
                      <p className="font-data mt-3 break-all text-2xs text-faint">{provider.baseURL}</p>
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