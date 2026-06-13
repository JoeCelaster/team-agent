"use client";

import React from "react";
import { AppProvider } from "@/app/context/AppContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
