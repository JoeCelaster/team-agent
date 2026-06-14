import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SimLauncher } from "@/components/SimLauncher";
import "./globals.css";

// Sharp, technical grotesque for all UI text.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Reserved for numeric / identifier data via the `font-data` / `font-mono` classes.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AuraOnboard | Enterprise Team Onboarding Agent",
  description: "Seamlessly onboard users with pre-assigned roles, tool mappings, and instant portal access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-foreground selection:bg-accent selection:text-white">
        <Providers>
          {children}
          <SimLauncher />
        </Providers>
      </body>
    </html>
  );
}
