"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Session } from "@/lib/types";

// Front door: route by existing session instead of dropping everyone on one page.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("onboard-session");
    if (!raw) {
      router.replace("/login");
      return;
    }
    try {
      const session = JSON.parse(raw) as Session;
      router.replace(session.is_admin ? "/admin" : "/dashboard");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
    </div>
  );
}
