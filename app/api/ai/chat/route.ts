import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import {
  formatError,
  getProviderById,
  getSortedProviderCandidates,
  isRateLimitError,
  markProviderFailure,
  markProviderSuccess,
} from "@/lib/ai/provider-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: UIMessage["role"];
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
};

async function probeProvider(providerId: string, apiKey: string, baseURL: string) {
  const probeURL = new URL("models", baseURL.endsWith("/") ? baseURL : `${baseURL}/`);
  const response = await fetch(probeURL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(2_500),
  });

  if (response.ok) {
    return { ok: true as const };
  }

  const body = await response.text();
  return {
    ok: false as const,
    status: response.status,
    error: `${providerId} probe failed with HTTP ${response.status}: ${body.slice(0, 200)}`,
  };
}

function toUIMessage(message: ChatMessage): Omit<UIMessage, "id"> {
  return {
    role: message.role,
    parts: [
      {
        type: "text",
        text: message.content,
      },
    ],
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "Request body must include a non-empty messages array." },
      { status: 400 },
    );
  }

  const candidates = getSortedProviderCandidates();
  if (candidates.length === 0) {
    return NextResponse.json(
      {
        error:
          "No AI providers are configured. Add AI_PROVIDER_POOL or one of the supported provider env groups.",
      },
      { status: 500 },
    );
  }

  let lastError: string | undefined;

  for (const candidate of candidates) {
    const provider = getProviderById(candidate.id);
    if (!provider) {
      continue;
    }

    try {
      const probe = await probeProvider(candidate.id, provider.apiKey, provider.baseURL);
      if (!probe.ok) {
        markProviderFailure(candidate.id, probe.error);
        lastError = probe.error;
        continue;
      }

      const openai = createOpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      });

      const modelMessages = await convertToModelMessages(body.messages.map(toUIMessage));

      const result = streamText({
        model: openai(provider.model),
        messages: modelMessages,
        system: body.system,
        temperature: body.temperature,
        maxOutputTokens: body.maxTokens,
      });

      markProviderSuccess(candidate.id);

      return result.toTextStreamResponse({
        headers: {
          "x-ai-provider-id": provider.id,
          "x-ai-provider-model": provider.model,
        },
      });
    } catch (error) {
      const message = formatError(error);
      markProviderFailure(candidate.id, error);
      lastError = message;

      if (!isRateLimitError(error)) {
        continue;
      }
    }
  }

  return NextResponse.json(
    {
      error: "All configured providers failed for this request.",
      details: lastError ?? "No provider returned a usable response.",
    },
    { status: 503 },
  );
}
