"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Loader2, CheckCircle2, Wrench, AlertTriangle,
  SquarePen, Plus, Shield, Clock, Map, List, Sparkles, BarChart2,
} from "lucide-react";
import type { Session } from "@/lib/types";

type ToolCall = {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
};

type Props = {
  session: Session;
  onAccessRequested: () => void;
};

const STARTERS: Array<{ label: string; prompt: string; Icon: React.ElementType; iconClass: string }> = [
  { label: "Mandatory tools first",        prompt: "What mandatory tools do I need first?",         Icon: Shield,    iconClass: "text-red-400"    },
  { label: "Request all role access",      prompt: "Request all role-relevant access for me",        Icon: CheckCircle2, iconClass: "text-emerald-400" },
  { label: "How long for pending access?", prompt: "How long until my pending access arrives?",      Icon: Clock,     iconClass: "text-amber-400"  },
  { label: "Generate onboarding roadmap",  prompt: "Generate my onboarding roadmap",                 Icon: Map,       iconClass: "text-blue-400"   },
  { label: "Tools still missing",          prompt: "What tools am I still missing?",                 Icon: List,      iconClass: "text-indigo-400" },
  { label: "Summarise access status",      prompt: "Summarise my access status",                     Icon: BarChart2, iconClass: "text-subtle"     },
];

export function SupportBot({ session, onAccessRequested }: Props) {
  const storageKey = `onboard-chat:support:${session.id}`;
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated]           = useState(false);
  const [input, setInput]                 = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);

  // Hydrate persisted history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
    } catch { /* ignore corrupt storage */ }
    setHydrated(true);
  }, [storageKey]);

  // Persist on every change (after hydration, so the initial empty state can't clobber stored history)
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (messages.length === 0) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch { /* ignore quota errors */ }
  }, [messages, hydrated, storageKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowQuickActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setShowQuickActions(false);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          employee_id: session.id,
          role_id: session.role_id,
          org_id: session.org_id,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message ?? "Sorry, I encountered an error.",
          toolCalls: data.toolCalls ?? [],
        },
      ]);

      if ((data.toolCalls as ToolCall[])?.some((tc) => tc.name === "request_access" && tc.result?.success)) {
        onAccessRequested();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Network error — please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden">
      {/* Status line */}
      <div className="flex items-center justify-between px-1 pb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-2xs text-subtle">Multi-provider AI · can take actions</span>
        </div>
        <button
          onClick={() => setMessages([])}
          title="New conversation"
          className="text-faint hover:text-muted transition-colors p-0.5 rounded"
        >
          <SquarePen className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3.5 min-h-0 pr-0.5">
        {messages.length === 0 && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-surface-2 rounded-lg rounded-tl-sm px-3.5 py-2.5 text-xs text-muted leading-relaxed max-w-[90%]">
              Hi {session.full_name.split(" ")[0]}! I&apos;m your onboarding assistant. I can answer questions, request
              tool access on your behalf, and help you prioritise your first week.
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`animate-rise-in flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser ? "bg-surface-2" : "bg-accent"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5 text-muted" /> : <Bot className="w-3.5 h-3.5 text-white" />}
              </div>

              <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                {msg.toolCalls?.map((tc, i) => {
                  const isRequest  = tc.name === "request_access";
                  const success    = isRequest && (tc.result as { success?: boolean }).success;
                  const isValidate = tc.name === "validate_role";
                  const relevant   = isValidate && (tc.result as { is_relevant?: boolean }).is_relevant;

                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-medium border ${
                        success
                          ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300"
                          : isValidate
                          ? relevant
                            ? "bg-indigo-950/40 border-indigo-500/20 text-indigo-300"
                            : "bg-amber-950/40 border-amber-500/20 text-amber-300"
                          : "bg-surface-2 border-border text-muted"
                      }`}
                    >
                      {success ? (
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                      ) : isValidate && !relevant ? (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      ) : (
                        <Wrench className="w-3 h-3 shrink-0" />
                      )}
                      {isRequest && success && (
                        (tc.result as { auto_approved?: boolean }).auto_approved
                          ? `✅ ${tc.args.resource_name} — access granted!`
                          : `✅ ${tc.args.resource_name} requested — pending admin approval`
                      )}
                      {isRequest && !success && `Failed to request ${tc.args.resource_name}`}
                      {isValidate &&
                        `${tc.args.resource_name} is ${relevant ? "✓ mapped to your role" : "⚠ not standard for your role"}`}
                    </div>
                  );
                })}

                {msg.content && (
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-accent text-white rounded-tr-sm"
                        : "bg-surface-2 text-muted rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-surface-2 rounded-lg rounded-tl-sm px-3.5 py-3">
              <Loader2 className="w-3.5 h-3.5 text-subtle animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="relative shrink-0 flex items-center gap-2 pt-3 border-t border-border mt-2"
      >
        {/* + quick actions button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`w-9 h-9 flex items-center justify-center rounded-md border transition-all duration-200 ${
              showQuickActions
                ? "bg-accent/10 border-accent text-accent rotate-45"
                : "bg-inset border-border text-muted hover:text-foreground hover:border-accent/50"
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>

          {showQuickActions && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-surface border border-border rounded-lg shadow-xl animate-rise-in overflow-hidden z-20">
              <div className="px-2 pt-2 pb-1">
                <p className="text-2xs font-semibold uppercase tracking-widest text-faint px-1 pb-1.5">Quick actions</p>
              </div>
              <div className="px-1.5 pb-1.5 space-y-0.5">
                {STARTERS.map(({ label, prompt, Icon, iconClass }) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted hover:text-foreground hover:bg-surface-2 rounded-md transition-colors text-left"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything…"
          disabled={isLoading}
          className="flex-1 bg-inset border border-border focus:border-accent text-foreground text-xs rounded-md px-3.5 py-2.5 outline-none transition-colors placeholder:text-faint disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-9 h-9 flex items-center justify-center bg-accent hover:bg-accent-hover disabled:opacity-40 rounded-md transition-colors duration-200 ease-out active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </form>
    </div>
  );
}
