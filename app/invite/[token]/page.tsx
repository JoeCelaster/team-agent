"use client";

import React, { use, useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Building2,
  Laptop,
  Sparkles
} from "lucide-react";
import {
  GithubIcon,
  SlackIcon,
  FigmaIcon,
  NotionIcon,
  GoogleDriveIcon,
  LinearIcon
} from "@/components/BrandIcons";
import { useRouter } from "next/navigation";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { users, roles, tools, joinUser, org } = useApp();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Find user based on token
  const invitedUser = users.find((u) => u.token === token);
  
  // Find role based on user's role name
  const userRole = roles.find(
    (r) => r.name.toLowerCase() === invitedUser?.role.toLowerCase() || r.id === invitedUser?.role.toLowerCase()
  );

  // Tools assigned to this role
  const allowedTools = tools.filter((tool) => userRole?.allowedTools.includes(tool.id));

  // If already joined, direct straight to dashboard, but let them review
  useEffect(() => {
    if (invitedUser && invitedUser.status === "joined" && step === 1) {
      setName(invitedUser.name || "");
      setStep(3); // skip to profile summary page if already joined
    }
  }, [invitedUser, step]);

  if (!invitedUser) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-canvas p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-inset border border-border p-8 rounded-3xl shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Invalid or Expired Invite</h1>
            <p className="text-sm text-muted leading-relaxed">
              This invitation link is invalid or has expired. Please contact your administrator to receive a new invite.
            </p>
          </div>
          <button
            onClick={() => router.push("/inbox")}
            className="w-full bg-surface-2 hover:bg-surface-2 text-foreground border border-border-strong py-3 rounded-xl font-semibold text-sm transition-all"
          >
            Go to Inbox Simulator
          </button>
        </div>
      </div>
    );
  }

  // Get matching tool icon
  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "Github": return <GithubIcon className="w-5 h-5 text-muted" />;
      case "Slack": return <SlackIcon className="w-5 h-5 text-purple-400" />;
      case "BookOpen": return <NotionIcon className="w-5 h-5 text-amber-500" />;
      case "HardDrive": return <GoogleDriveIcon className="w-5 h-5 text-blue-400" />;
      case "Figma": return <FigmaIcon className="w-5 h-5 text-rose-500" />;
      case "CheckSquare": return <LinearIcon className="w-5 h-5 text-indigo-400" />;
      default: return <Laptop className="w-5 h-5" />;
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    // Simulate slight API delay for aesthetics
    setTimeout(() => {
      joinUser(token, name, password);
      setIsLoading(false);
      setStep(3);
    }, 8000 * 0.1); // 800ms
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background blobs for premium linear style */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] bg-indigo-500 rounded-full blur-[80px]"></div>
        <div className="absolute top-[10%] right-[20%] w-[350px] h-[350px] bg-purple-500 rounded-full blur-[80px]"></div>
      </div>

      <div className="max-w-2xl w-full mx-auto relative z-10">
        {/* Logo / Org Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            {org.name} Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Activate Your Account
          </h1>
          <p className="text-sm text-muted mt-2">
            Securely join and claim your pre-assigned team permissions
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 text-xs font-medium ${step >= 1 ? "text-indigo-400" : "text-subtle"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs border ${
              step > 1 ? "bg-indigo-500 border-indigo-500 text-white" : step === 1 ? "border-indigo-400 text-indigo-400" : "border-border"
            }`}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span>Invitation</span>
          </div>
          <div className="w-8 h-px bg-surface-2"></div>
          <div className={`flex items-center gap-2 text-xs font-medium ${step >= 2 ? "text-indigo-400" : "text-subtle"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs border ${
              step > 2 ? "bg-indigo-500 border-indigo-500 text-white" : step === 2 ? "border-indigo-400 text-indigo-400" : "border-border"
            }`}>
              {step > 2 ? "✓" : "2"}
            </span>
            <span>Security</span>
          </div>
          <div className="w-8 h-px bg-surface-2"></div>
          <div className={`flex items-center gap-2 text-xs font-medium ${step >= 3 ? "text-indigo-400" : "text-subtle"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs border ${
              step === 3 ? "border-indigo-400 text-indigo-400" : "border-border"
            }`}>
              3
            </span>
            <span>Your Profile</span>
          </div>
        </div>

        {/* STEP 1: INVITE PREVIEW */}
        {step === 1 && (
          <div className="bg-inset border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                You've been invited!
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                An administrator has invited <span className="text-foreground font-semibold">{invitedUser.email}</span> to join the <span className="text-foreground font-semibold">{org.name}</span> organization. Your profile settings and permissions have been mapped in advance.
              </p>
            </div>

            {/* Assigned Role */}
            <div className="bg-inset border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-subtle uppercase tracking-wider">Assigned Role</span>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold">
                  {userRole?.name || invitedUser.role}
                </span>
              </div>
              <p className="text-xs text-muted">
                {userRole?.description || "Pre-configured system role with specific tool credentials."}
              </p>
            </div>

            {/* Granted Tool Access */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-subtle uppercase tracking-wider block">Access Permissions Granted</span>
              {allowedTools.length === 0 ? (
                <p className="text-xs text-subtle bg-inset p-4 rounded-xl border border-border text-center">
                  No default software access configured for this role.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allowedTools.map((tool) => (
                    <div 
                      key={tool.id}
                      className="flex items-center gap-3 bg-inset border border-border p-3.5 rounded-xl hover:border-border-strong/80 transition-colors"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-inset`}>
                        {getToolIcon(tool.iconName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{tool.name}</p>
                        <p className="text-2xs text-subtle truncate">{tool.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accept Button */}
            <button
              onClick={handleNextStep}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all group cursor-pointer"
            >
              Accept Invitation & Setup Security
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* STEP 2: PASSWORD SETUP */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="bg-inset border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Complete Profile Setup
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email (Pre-filled and Locked) */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Invited Email (Locked)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-faint">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={invitedUser.email}
                    disabled
                    className="w-full bg-inset border border-border text-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-2xs text-subtle mt-1">
                  Your email address was pre-verified by your administrator.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-subtle">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your first and last name"
                    className="w-full bg-inset border border-border focus:border-indigo-500 text-foreground rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-faint"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-subtle">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-inset border border-border focus:border-indigo-500 text-foreground rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-faint"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-subtle">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-inset border border-border focus:border-indigo-500 text-foreground rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-faint"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {isLoading ? "Saving Credentials..." : "Complete Activation"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: CONFIRM PROFILE & ACCESS (KEY SCREEN) */}
        {step === 3 && (
          <div className="bg-inset border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center py-2">
              <div className="mx-auto w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 mb-3">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Profile Activated!</h2>
              <p className="text-xs text-muted mt-1">Here is a summary of your assigned organizational access</p>
            </div>

            {/* Profile Card */}
            <div className="bg-inset border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider">Your Profile Card</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                  {name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : invitedUser.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{name || invitedUser.name}</p>
                  <p className="text-xs text-muted truncate">{invitedUser.email}</p>
                  <p className="text-2xs text-subtle mt-0.5">{org.name} ({org.domain})</p>
                </div>
              </div>
            </div>

            {/* Role details */}
            <div className="bg-inset border border-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-subtle uppercase tracking-wider">Assigned Role</span>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold">
                  {userRole?.name || invitedUser.role}
                </span>
              </div>
              <p className="text-xs text-muted">
                {userRole?.description || "Pre-configured system role with specific tool credentials."}
              </p>
            </div>

            {/* Access Given list */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-subtle uppercase tracking-wider block">Access Granted ({allowedTools.length})</span>
              {allowedTools.length === 0 ? (
                <div className="bg-inset border border-border p-4 rounded-xl text-center text-xs text-subtle">
                  No default software access configured for this role.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allowedTools.map((tool) => (
                    <div 
                      key={tool.id}
                      className="flex items-center justify-between bg-inset border border-border p-3.5 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-inset`}>
                          {getToolIcon(tool.iconName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">{tool.name}</p>
                          <p className="text-2xs text-subtle truncate">{tool.category}</p>
                        </div>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-2xs font-bold">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Go to Dashboard CTA */}
            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all group cursor-pointer"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
