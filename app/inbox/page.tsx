"use client";

import React, { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { Mail, ArrowRight, Trash2, MailOpen, AlertCircle, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InboxPage() {
  const { emails, clearEmails, markEmailAsRead } = useApp();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    emails.length > 0 ? emails[0].id : null
  );
  const router = useRouter();

  // If selected email ID is no longer valid, set it to the first email
  const currentSelectedId = emails.some(e => e.id === selectedEmailId) 
    ? selectedEmailId 
    : (emails.length > 0 ? emails[0].id : null);

  const selectedEmail = emails.find((e) => e.id === currentSelectedId);

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    markEmailAsRead(id);
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">
      {/* Header */}
      <header className="border-b border-border bg-canvas/85 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Simulated email client</h1>
            <p className="text-xs text-subtle">Test the onboarding emails sent by the Admin Panel</p>
          </div>
        </div>

        {emails.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Clear all mock emails?")) {
                clearEmails();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-inset hover:bg-red-950/30 border border-border hover:border-red-500/30 text-muted hover:text-red-400 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Inbox
          </button>
        )}
      </header>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email List */}
        <div className="w-80 md:w-96 border-r border-border bg-inset flex flex-col">
          <div className="p-4 border-b border-border bg-inset/20 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-subtle">Inbox</span>
            <span className="text-xs bg-inset text-muted px-2 py-0.5 rounded-full border border-border">
              {emails.length} total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-subtle">
                <Inbox className="w-10 h-10 text-faint mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold">No emails sent yet</p>
                <p className="text-xs text-faint mt-1 max-w-[200px]">
                  Go to the Admin Console, invite a user, and their invite email will appear here.
                </p>
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = email.id === currentSelectedId;
                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email.id)}
                    className={`p-4 cursor-pointer transition-colors relative flex items-start gap-3 ${
                      isSelected 
                        ? "bg-indigo-500/5 hover:bg-indigo-500/10" 
                        : "hover:bg-surface-2/50"
                    }`}
                  >
                    {/* Read indicator */}
                    {!email.read && (
                      <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-indigo-500"></span>
                    )}

                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? "bg-indigo-500/15 text-indigo-400" : "bg-inset text-subtle"
                    }`}>
                      {email.read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <p className={`text-xs font-semibold truncate ${
                          email.read ? "text-muted" : "text-foreground"
                        }`}>
                          {email.to}
                        </p>
                        <span className="text-2xs text-subtle shrink-0">
                          {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${
                        isSelected ? "text-indigo-300 font-medium" : "text-muted"
                      }`}>
                        {email.subject}
                      </p>
                      <p className="text-2xs text-subtle mt-1 line-clamp-1">
                        {email.body.replace(/\n\n/g, ' ')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Email Reader */}
        <div className="flex-1 bg-inset flex flex-col">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full">
              {/* Mail Envelope Header */}
              <div className="bg-inset/40 border border-border rounded-xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-start gap-4 border-b border-border pb-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-foreground">{selectedEmail.subject}</h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span className="text-subtle">From:</span>
                      <span className="font-semibold text-muted">system@auraonboard.com</span>
                      <span className="text-faint">•</span>
                      <span className="text-subtle">To:</span>
                      <span className="font-semibold text-muted">{selectedEmail.to}</span>
                    </div>
                  </div>
                  <span className="text-xs text-subtle">
                    {new Date(selectedEmail.sentAt).toLocaleString()}
                  </span>
                </div>

                {/* Body */}
                <div className="text-sm text-muted leading-relaxed whitespace-pre-line font-data py-2">
                  {selectedEmail.body}
                </div>

                {/* Call to Action Button */}
                <div className="pt-4 border-t border-border flex flex-col items-center">
                  <button
                    onClick={() => router.push(`/invite/${selectedEmail.token}`)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all group"
                  >
                    Accept Invitation
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="text-2xs text-subtle mt-3 font-data">
                    Target URL: <span className="text-muted">/invite/{selectedEmail.token}</span>
                  </p>
                </div>
              </div>

              {/* Dev Simulation Tip */}
              <div className="mt-6 flex items-start gap-2 bg-inset/20 border border-border/40 rounded-xl p-4 text-xs text-subtle">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  This is a simulation screen designed to replicate real-world email invitation clicks. In a production system, this email is sent over SMTP, and clicking "Accept Invitation" directs the user to the portal's onboarding flow.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-subtle">
              <Mail className="w-12 h-12 text-faint mb-3 stroke-[1.5]" />
              <p className="text-base font-semibold">No Email Selected</p>
              <p className="text-sm text-faint mt-1 max-w-[320px]">
                Choose an email from the left sidebar to view its details and accept the invitation link.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
