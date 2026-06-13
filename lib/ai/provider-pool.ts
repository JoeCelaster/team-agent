type ProviderKind = "openai-compatible";

export type ProviderConfig = {
  id: string;
  label: string;
  kind: ProviderKind;
  apiKey: string;
  baseURL: string;
  model: string;
  priority: number;
};

type ProviderState = {
  consecutiveFailures: number;
  cooldownUntil: number;
  lastUsedAt: number;
  lastSuccessAt: number;
  lastError?: string;
};

export type ProviderSnapshot = ProviderConfig &
  ProviderState & {
    available: boolean;
    cooldownRemainingMs: number;
  };

type ProviderCatalogEntry = Partial<ProviderConfig> & {
  id: string;
  label?: string;
  apiKeyEnv?: string;
  envPrefix?: string;
};

type PoolState = {
  providers: ProviderConfig[];
  runtime: Map<string, ProviderState>;
};

declare global {
  var __teamAgentProviderPool: PoolState | undefined;
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  xai: "https://api.x.ai/v1",
  together: "https://api.together.xyz/v1",
  deepseek: "https://api.deepseek.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  mistral: "https://api.mistral.ai/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
  perplexity: "https://api.perplexity.ai",
  azure_openai: "",
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  xai: "grok-2-latest",
  together: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
  deepseek: "deepseek-chat",
  openrouter: "openai/gpt-4o-mini",
  mistral: "mistral-large-latest",
  fireworks: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  perplexity: "sonar-pro",
  azure_openai: "gpt-4o-mini",
};

const COMMON_PREFIXES = [
  "OPENAI",
  "GROQ",
  "XAI",
  "TOGETHER",
  "DEEPSEEK",
  "OPENROUTER",
  "MISTRAL",
  "FIREWORKS",
  "PERPLEXITY",
  "AZURE_OPENAI",
];

const poolState = globalThis.__teamAgentProviderPool ?? initializePool();
globalThis.__teamAgentProviderPool = poolState;

function initializePool(): PoolState {
  const providers = loadProvidersFromEnvironment();
  return {
    providers,
    runtime: new Map(providers.map((provider) => [provider.id, createInitialState()])),
  };
}

function createInitialState(): ProviderState {
  return {
    consecutiveFailures: 0,
    cooldownUntil: 0,
    lastUsedAt: 0,
    lastSuccessAt: 0,
  };
}

function loadProvidersFromEnvironment(): ProviderConfig[] {
  const configured = parseJsonPool(process.env.AI_PROVIDER_POOL ?? process.env.AI_PROVIDERS);
  if (configured.length > 0) {
    return configured;
  }

  const discovered: ProviderConfig[] = Object.entries(process.env)
    .flatMap(([key, value]) => {
      if (!value) {
        return [];
      }

      const match = key.match(/^([A-Z0-9_]+)_API_KEY(?:_(\d+))?$/);
      if (!match) {
        return [];
      }

      const prefix = match[1];
      const suffix = match[2];
      const family = prefix.toLowerCase();
      const providerId = suffix ? `${family}_${suffix}` : family;
      const baseURL = resolveBaseURL(family, suffix);
      const model = resolveModel(family, suffix);

      if (!baseURL || !model) {
        return [];
      }

      return [
        {
          id: providerId,
          label: humanizePrefix(providerId),
          kind: "openai-compatible" as const,
          apiKey: value,
          baseURL,
          model,
          priority: readNumberEnv(`${prefix}${suffix ? `_${suffix}` : ""}_PRIORITY`) ?? defaultPriority(family),
        },
      ];
    })
    .filter((provider, index, providers) => providers.findIndex((candidate) => candidate.id === provider.id) === index);

  return discovered.length > 0
    ? discovered
    : COMMON_PREFIXES.flatMap((prefix) => {
        const apiKey = readEnvValue(`${prefix}_API_KEY`, `${prefix}_KEY`);
        if (!apiKey) {
          return [];
        }

        const id = prefix.toLowerCase();
        const baseURL = readEnvValue(`${prefix}_BASE_URL`, `${prefix}_URL`) ?? DEFAULT_BASE_URLS[id];
        const model = readEnvValue(`${prefix}_MODEL`) ?? DEFAULT_MODELS[id];
        const label = humanizePrefix(prefix);
        const priority = readNumberEnv(`${prefix}_PRIORITY`) ?? defaultPriority(id);

        if (!baseURL || !model) {
          return [];
        }

        return [
          {
            id,
            label,
            kind: "openai-compatible" as const,
            apiKey,
            baseURL,
            model,
            priority,
          },
        ];
      });
}

function parseJsonPool(rawValue: string | undefined): ProviderConfig[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as ProviderCatalogEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry, index) => {
      const apiKey = entry.apiKey ?? (entry.apiKeyEnv ? process.env[entry.apiKeyEnv] : undefined);
      const baseURL = entry.baseURL ?? resolveBaseURL(entry.id, entry.envPrefix);
      const model = entry.model ?? resolveModel(entry.id, entry.envPrefix);
      if (!apiKey || !baseURL || !model) {
        return [];
      }

      return [
        {
          id: entry.id,
          label: entry.label ?? humanizePrefix(entry.id),
          kind: "openai-compatible",
          apiKey,
          baseURL,
          model,
          priority: entry.priority ?? 100 - index,
        },
      ];
    });
  } catch {
    return [];
  }
}

function resolveBaseURL(family: string, suffix?: string) {
  const key = family.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
  const suffixKey = suffix ? `${key}_${suffix}` : key;
  return (
    readEnvValue(`${suffixKey}_BASE_URL`, `${suffixKey}_URL`, `${key}_BASE_URL`, `${key}_URL`) ??
    DEFAULT_BASE_URLS[family]
  );
}

function resolveModel(family: string, suffix?: string) {
  const key = family.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
  const suffixKey = suffix ? `${key}_${suffix}` : key;
  return readEnvValue(`${suffixKey}_MODEL`, `${key}_MODEL`) ?? DEFAULT_MODELS[family];
}

function readEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function readNumberEnv(key: string) {
  const rawValue = process.env[key];
  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function humanizePrefix(prefix: string) {
  return prefix
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function defaultPriority(id: string) {
  switch (id) {
    case "openai":
      return 100;
    case "groq":
      return 95;
    case "openrouter":
      return 90;
    case "xai":
      return 85;
    case "together":
      return 80;
    default:
      return 70;
  }
}

function getRuntimeState(providerId: string) {
  const existing = poolState.runtime.get(providerId);
  if (existing) {
    return existing;
  }

  const fallback = createInitialState();
  poolState.runtime.set(providerId, fallback);
  return fallback;
}

function calculateCooldownMs(failureCount: number, isRateLimited: boolean) {
  const baseCooldown = isRateLimited ? 30_000 : 10_000;
  const multiplier = Math.min(6, Math.max(1, failureCount));
  return Math.min(5 * 60_000, baseCooldown * multiplier);
}

export function getProviderPool() {
  return poolState.providers;
}

export function getProviderSnapshots(): ProviderSnapshot[] {
  const now = Date.now();

  return poolState.providers.map((provider) => {
    const state = getRuntimeState(provider.id);
    const available = state.cooldownUntil <= now;
    return {
      ...provider,
      ...state,
      available,
      cooldownRemainingMs: Math.max(0, state.cooldownUntil - now),
      lastError: available ? undefined : state.lastError,
    };
  });
}

export function getProviderById(providerId: string) {
  return poolState.providers.find((provider) => provider.id === providerId);
}

export function getSortedProviderCandidates() {
  const now = Date.now();

  return getProviderSnapshots()
    .filter((provider) => provider.available)
    .sort((left, right) => {
      if (left.consecutiveFailures !== right.consecutiveFailures) {
        return left.consecutiveFailures - right.consecutiveFailures;
      }

      if (left.priority !== right.priority) {
        return right.priority - left.priority;
      }

      if (left.lastUsedAt !== right.lastUsedAt) {
        return left.lastUsedAt - right.lastUsedAt;
      }

      return left.id.localeCompare(right.id);
    })
    .map((provider) => ({ ...provider, available: provider.cooldownUntil <= now }));
}

export function markProviderSuccess(providerId: string) {
  const state = getRuntimeState(providerId);
  state.consecutiveFailures = 0;
  state.cooldownUntil = 0;
  state.lastUsedAt = Date.now();
  state.lastSuccessAt = Date.now();
  state.lastError = undefined;
}

export function markProviderFailure(providerId: string, error: unknown) {
  const state = getRuntimeState(providerId);
  state.consecutiveFailures += 1;
  state.lastUsedAt = Date.now();
  state.lastError = formatError(error);
  state.cooldownUntil = Date.now() + calculateCooldownMs(state.consecutiveFailures, isRateLimitError(error));
}

export function isRateLimitError(error: unknown) {
  const message = formatError(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("quota") ||
    message.includes("insufficient_quota")
  );
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message || error.name;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown provider error";
}
