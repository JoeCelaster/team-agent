"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, CheckCircle2, Wrench, AlertTriangle } from "lucide-react";
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

const STARTERS = [
  "What mandatory tools do I need first?",
  "Request GitHub access for me",
  "How long until my pending access arrives?",
  "Generate my onboarding roadmap",
];

export function SupportBot({ session, onAccessRequested }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
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

      // Trigger dashboard refetch if agent requested access
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
      <div className="flex items-center gap-1.5 px-1 pb-2 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] text-zinc-500">Multi-provider AI · can take actions</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3.5 min-h-0 pr-0.5">
        {/* Welcome + starters */}
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-zinc-300 leading-relaxed max-w-[90%]">
                Hi {session.full_name.split(" ")[0]}! I&apos;m your onboarding assistant. I can answer questions, request
                tool access on your behalf, and help you prioritise your first week.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-8">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[10px] px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
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
                  isUser ? "bg-zinc-700" : "bg-indigo-600"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5 text-zinc-300" /> : <Bot className="w-3.5 h-3.5 text-white" />}
              </div>

              <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                {/* Tool call badges */}
                {msg.toolCalls?.map((tc, i) => {
                  const isRequest = tc.name === "request_access";
                  const success = isRequest && (tc.result as { success?: boolean }).success;
                  const isValidate = tc.name === "validate_role";
                  const relevant = isValidate && (tc.result as { is_relevant?: boolean }).is_relevant;

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
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {success ? (
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                      ) : isValidate && !relevant ? (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      ) : (
                        <Wrench className="w-3 h-3 shrink-0" />
                      )}
                      {isRequest && success && `✅ ${tc.args.resource_name} requested — pending admin approval`}
                      {isRequest && !success && `Failed to request ${tc.args.resource_name}`}
                      {isValidate &&
                        `${tc.args.resource_name} is ${relevant ? "✓ mapped to your role" : "⚠ not standard for your role"}`}
                    </div>
                  );
                })}

                {/* Message bubble */}
                {msg.content && (
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-zinc-800 text-zinc-300 rounded-tl-sm"
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
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-3">
              <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="shrink-0 flex items-center gap-2 pt-3 border-t border-zinc-800/60 mt-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything…"
          disabled={isLoading}
          className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/60 text-zinc-200 text-[12px] rounded-xl px-3.5 py-2.5 outline-none transition-colors placeholder:text-zinc-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-all duration-200 ease-out active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </form>
    </div>
  );
}
