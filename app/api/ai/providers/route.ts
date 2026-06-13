import { NextResponse } from "next/server";
import { getProviderSnapshots } from "@/lib/ai/provider-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const providers = getProviderSnapshots();

  return NextResponse.json({
    configured: providers.length,
    available: providers.filter((provider) => provider.available).length,
    providers,
  });
}
