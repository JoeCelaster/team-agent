"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, CheckCircle2, Sparkles, XCircle, Plus, Check, X, SquarePen } from "lucide-react";
import type { Session, AdminRequestRow } from "@/lib/types";

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
  queue: AdminRequestRow[];
  onAction: () => void;
};

const STARTERS = [
  "Summarize pending queue",
  "Approve all pending requests",
];

export function ApprovalAssistant({ session, queue, onAction }: Props) {
  const storageKey = `onboard-chat:admin:${session.id}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hydrate persisted history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
    } catch { /* ignore corrupt storage */ }
    setHydrated(true);
  }, [storageKey]);

  // Persist on every change (after hydration, so we don't clobber stored history with the initial empty state)
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
    if (bottomRef.current) {
      const el = bottomRef.current;
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "end" }), 60);
    }
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          queue,
          admin_id: session.id,
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

      // Trigger dashboard refetch if agent approved requests
      if ((data.toolCalls as ToolCall[])?.some((tc) => tc.name === "bulk_approve_requests" && tc.result?.success)) {
        onAction();
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
    <div className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden shadow-sm h-[350px] sm:h-[450px] xl:h-[calc(100vh-12rem)]">
      <div className="relative shrink-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-medium text-foreground">Approval Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-subtle px-2 py-0.5 rounded-full border border-border bg-surface-2">
              {queue.length} pending
            </span>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                title="New conversation"
                className="text-faint hover:text-muted transition-colors p-0.5 rounded"
              >
                <SquarePen className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-surface-2 rounded-lg rounded-tl-sm px-3.5 py-2.5 text-xs text-muted leading-relaxed max-w-[90%]">
                Hi {session.full_name.split(" ")[0]}! I can help you process requests faster. I&apos;ll list every pending request — standard and out-of-scope — and approve any of them with your confirmation.
              </div>
            </div>
              <div className="flex flex-wrap gap-2 pl-8">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-2xs px-3 py-1.5 rounded-md bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-2 hover:border-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`animate-rise-in flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser ? "bg-surface-2" : "bg-indigo-600"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5 text-muted" /> : <Bot className="w-3.5 h-3.5 text-white" />}
              </div>

              <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                {/* Tool call badges */}
                {msg.toolCalls?.map((tc, i) => {
                  const success = (tc.result as { success?: boolean }).success;
                  const approvedCount = (tc.result as { approved_count?: number }).approved_count;
                  
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-medium border ${
                        success
                          ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300"
                          : "bg-red-950/40 border-red-500/20 text-red-300"
                      }`}
                    >
                      {success
                        ? <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-300" />
                        : <XCircle className="w-3 h-3 shrink-0 text-red-300" />}
                      {success
                        ? `Approved ${approvedCount} request${approvedCount === 1 ? "" : "s"}`
                        : "Failed to process approval"}
                    </div>
                  );
                })}

                {msg.content && (
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-surface-2 text-foreground rounded-tl-sm border border-border/50"
                    }`}
                  >
                    {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => 
                      part.startsWith("**") && part.endsWith("**") 
                        ? <strong key={part + i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
                        : part
                    )}
                    
                    {!isUser && msg === messages[messages.length - 1] && msg.content.toLowerCase().includes("do you want to proceed?") && !isLoading && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                        <button
                          onClick={() => sendMessage("Yes, proceed")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Yes, approve
                        </button>
                        <button
                          onClick={() => sendMessage("No, cancel")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
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
        className="relative shrink-0 flex items-center gap-2 p-3 border-t border-border bg-surface-2/10"
      >
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all ${
              showQuickActions 
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 rotate-45" 
                : "bg-inset border-border text-muted hover:text-foreground hover:border-indigo-500/50"
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>

          {showQuickActions && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-surface border border-border rounded-lg shadow-xl animate-rise-in overflow-hidden z-20">
              <div className="p-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => { sendMessage("Summarize pending queue"); setShowQuickActions(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted hover:text-foreground hover:bg-surface-2 rounded-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Summarize queue
                </button>
                <button
                  type="button"
                  onClick={() => { sendMessage("Approve all pending requests"); setShowQuickActions(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted hover:text-foreground hover:bg-surface-2 rounded-md transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Approve all pending
                </button>
              </div>
            </div>
          )}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to summarize or approve..."
          disabled={isLoading}
          className="flex-1 bg-inset border border-border focus:border-indigo-500 text-foreground text-xs rounded-md px-3 py-2 outline-none transition-colors placeholder:text-faint disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-md transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-white -ml-0.5" />
        </button>
      </form>
    </div>
  );
}
