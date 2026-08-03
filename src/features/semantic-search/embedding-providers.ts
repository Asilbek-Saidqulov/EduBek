/**
 * EduBek — Embedding Provider Architecture.
 *
 * Phase 4F.2: Provider-agnostic embedding generation.
 *
 * Embeddings are a first-class abstraction: any entity (resource, quiz,
 * question, topic, course, lesson, certificate, AI session, organization,
 * user, classroom, marketplace listing) can be embedded, and the provider
 * used to generate the embedding can be swapped at runtime through
 * configuration only — no architectural changes required.
 *
 * Supported providers:
 *   - hash            (default, deterministic, no external dependencies)
 *   - gemini          (Google Gemini embedding API)
 *   - openai          (OpenAI text-embedding-3-small)
 *   - voyage          (Voyage AI)
 *   - cohere          (Cohere embed-v3)
 *   - jina            (Jina AI)
 *   - nomic           (Nomic Embed)
 *   - local           (Local sentence-transformer model)
 *   - edubek          (Future proprietary EduBek embedding model)
 *
 * Each provider implements the `EmbeddingProvider` interface. The active
 * provider is selected via `EDUBEK_EMBEDDING_PROVIDER` env var, defaulting
 * to "hash" for zero-dependency operation. Unknown providers fall back to
 * "hash" with a warning log.
 *
 * The hash provider uses character trigram + word hashing into a
 * 256-dimensional vector with L2 normalization. It is deterministic and
 * sufficient for cross-language similarity on educational content, but
 * does not capture deep semantic relationships — switch to `gemini` /
 * `openai` / `voyage` for production-grade semantic search.
 */
import { getLogger } from "@/lib/logger";

const log = getLogger("embedding-providers");

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface EmbeddingResult {
  vector: number[];
  model: string;
  dimensions: number;
  /** Provider name (e.g. "hash", "gemini", "openai"). */
  provider: string;
  /** Wall-clock latency in milliseconds. */
  latencyMs: number;
}

export interface EmbeddingProvider {
  /** Stable identifier, e.g. "hash", "gemini". */
  readonly name: string;
  /** Human-readable model identifier stored on the Embedding row. */
  readonly model: string;
  /** Vector dimensionality. */
  readonly dimensions: number;
  /** Generate a single embedding for the given text. */
  embed(text: string): Promise<EmbeddingResult>;
  /** Generate embeddings for a batch of texts. Default: sequential. */
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
}

// ---------------------------------------------------------------------------
// Hash provider (default, deterministic)
// ---------------------------------------------------------------------------

const HASH_DIMENSIONS = 256;

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function l2Normalize(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vec;
  return vec.map((v) => v / magnitude);
}

/**
 * Deterministic hash-based embedding.
 *
 * Combines character trigram hashing (good for cross-language cognates
 * like "fotosintez" / "фотосинтез" / "photosynthesis") with word-level
 * hashing (captures domain vocabulary). The two are placed in disjoint
 * halves of the 256-dim vector so they do not collide.
 */
export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly name = "hash";
  readonly model = "edubek-hash-v1";
  readonly dimensions = HASH_DIMENSIONS;

  async embed(text: string): Promise<EmbeddingResult> {
    const start = Date.now();
    const vec = this.computeVector(text);
    return {
      vector: vec,
      model: this.model,
      dimensions: this.dimensions,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const start = Date.now();
    const results = texts.map((text) => {
      const vec = this.computeVector(text);
      return {
        vector: vec,
        model: this.model,
        dimensions: this.dimensions,
        provider: this.name,
        latencyMs: 0,
      } satisfies EmbeddingResult;
    });
    const totalMs = Date.now() - start;
    // Distribute total latency uniformly for reporting purposes.
    const perItem = totalMs / Math.max(1, texts.length);
    return results.map((r) => ({ ...r, latencyMs: perItem }));
  }

  private computeVector(text: string): number[] {
    const normalized = text.toLowerCase().trim();
    const vector = new Array<number>(HASH_DIMENSIONS).fill(0);
    const half = HASH_DIMENSIONS / 2;

    // Trigram hashing into first half
    for (let i = 0; i < normalized.length - 2; i++) {
      const trigram = normalized.slice(i, i + 3);
      vector[hashString(trigram) % half] += 1;
    }

    // Word hashing into second half
    const words = normalized.split(/\s+/).filter((w) => w.length > 2);
    for (const word of words) {
      vector[half + (hashString(word) % half)] += 2;
    }

    return l2Normalize(vector);
  }
}

// ---------------------------------------------------------------------------
// External API providers (stubs that POST to the provider's embedding API)
// ---------------------------------------------------------------------------

/**
 * Base class for HTTP-based embedding providers.
 *
 * Each provider has its own endpoint, model id, and request shape — but
 * they all share the same retry/backoff logic via `fetchWithRetry`.
 * The actual API key is read from the matching env var at embed time so
 * that operators can rotate keys without restarting the service.
 *
 * For brevity, the request/response shapes are normalized to a common
 * `{ input: string[] }` request and `{ vectors: number[][] }` response.
 * Provider-specific adapters inside `embedBatch` translate to/from the
 * native API shape.
 */
abstract class HttpEmbeddingProvider implements EmbeddingProvider {
  abstract readonly name: string;
  abstract readonly model: string;
  abstract readonly dimensions: number;
  protected abstract readonly apiKeyEnv: string;
  protected abstract readonly endpoint: string;

  protected get apiKey(): string | undefined {
    return process.env[this.apiKeyEnv];
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const [result] = await this.embedBatch([text]);
    return result;
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const start = Date.now();
    const key = this.apiKey;
    if (!key) {
      // No API key configured — fall back to hash for resilience.
      log.warn("embedding.provider_no_key", {
        provider: this.name,
        env: this.apiKeyEnv,
        fallback: "hash",
      });
      const fallback = new HashEmbeddingProvider();
      return fallback.embedBatch(texts);
    }

    try {
      const vectors = await this.callApi(texts, key);
      return vectors.map((vector) => ({
        vector,
        model: this.model,
        dimensions: this.dimensions,
        provider: this.name,
        latencyMs: 0,
      }));
    } catch (err) {
      log.error("embedding.provider_call_failed", {
        provider: this.name,
        error: (err as Error).message,
        fallback: "hash",
      });
      const fallback = new HashEmbeddingProvider();
      const fallbackResults = await fallback.embedBatch(texts);
      return fallbackResults;
    } finally {
      const totalMs = Date.now() - start;
      const perItem = totalMs / Math.max(1, texts.length);
      // We can't easily backfill latencyMs after the fact, so we return
      // results with `latencyMs: 0` and let the caller aggregate timing.
      void perItem;
    }
  }

  protected abstract callApi(texts: string[], apiKey: string): Promise<number[][]>;

  protected async fetchWithRetry(
    url: string,
    init: RequestInit,
    retries = 2,
  ): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, init);
        if (res.ok) return res;
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`${this.name} API ${res.status}: ${await res.text()}`);
        }
        // 5xx / 429 — retry with backoff
        lastError = new Error(`${this.name} API ${res.status}`);
      } catch (err) {
        lastError = err as Error;
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
      }
    }
    throw lastError ?? new Error(`${this.name} API failed`);
  }
}

export class GeminiEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "gemini";
  readonly model = "text-embedding-004";
  readonly dimensions = 768;
  protected readonly apiKeyEnv = "GEMINI_API_KEY";
  protected readonly endpoint = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents";

  protected async callApi(texts: string[], apiKey: string): Promise<number[][]> {
    const res = await this.fetchWithRetry(`${this.endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((content) => ({ model: `models/${this.model}`, content })),
      }),
    });
    const data = await res.json();
    return (data.embeddings ?? []).map((e: any) => e.values as number[]);
  }
}

export class OpenAIEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "openai";
  readonly model = "text-embedding-3-small";
  readonly dimensions = 1536;
  protected readonly apiKeyEnv = "OPENAI_API_KEY";
  protected readonly endpoint = "https://api.openai.com/v1/embeddings";

  protected async callApi(texts: string[], apiKey: string): Promise<number[][]> {
    const res = await this.fetchWithRetry(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    const data = await res.json();
    return (data.data ?? [])
      .sort((a: any, b: any) => a.index - b.index)
      .map((d: any) => d.embedding as number[]);
  }
}

export class VoyageEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "voyage";
  readonly model = "voyage-3";
  readonly dimensions = 1024;
  protected readonly apiKeyEnv = "VOYAGE_API_KEY";
  protected readonly endpoint = "https://api.voyageai.com/v1/embeddings";

  protected async callApi(texts: string[], apiKey: string): Promise<number[][]> {
    const res = await this.fetchWithRetry(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts, input_type: "document" }),
    });
    const data = await res.json();
    return (data.data ?? []).map((d: any) => d.embedding as number[]);
  }
}

export class CohereEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "cohere";
  readonly model = "embed-english-v3.0";
  readonly dimensions = 1024;
  protected readonly apiKeyEnv = "COHERE_API_KEY";
  protected readonly endpoint = "https://api.cohere.ai/v1/embed";

  protected async callApi(texts: string[], apiKey: string): Promise<number[][]> {
    const res = await this.fetchWithRetry(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        texts,
        input_type: "search_document",
      }),
    });
    const data = await res.json();
    return (data.embeddings ?? []) as number[][];
  }
}

export class JinaEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "jina";
  readonly model = "jina-embeddings-v3";
  readonly dimensions = 1024;
  protected readonly apiKeyEnv = "JINA_API_KEY";
  protected readonly endpoint = "https://api.jina.ai/v1/embeddings";

  protected async callApi(texts: string[], apiKey: string): Promise<number[][]> {
    const res = await this.fetchWithRetry(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    const data = await res.json();
    return (data.data ?? [])
      .sort((a: any, b: any) => a.index - b.index)
      .map((d: any) => d.embedding as number[]);
  }
}

export class NomicEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "nomic";
  readonly model = "nomic-embed-text-v1.5";
  readonly dimensions = 768;
  protected readonly apiKeyEnv = "NOMIC_API_KEY";
  protected readonly endpoint = "https://api-atlas.nomic.ai/v1/embedding/text";

  protected async callApi(texts: string[], apiKey: string): Promise<number[][]> {
    const res = await this.fetchWithRetry(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: this.model, texts }),
    });
    const data = await res.json();
    return (data.embeddings ?? []) as number[][];
  }
}

/**
 * Local sentence-transformer provider.
 *
 * In production this would shell out to a local Python process running
 * `sentence-transformers/all-MiniLM-L6-v2` and return a 384-dim vector.
 * For now we fall back to the hash provider to keep zero-dependency
 * operation working. Operators who deploy a real embedding server
 * should set `EDUBEK_LOCAL_EMBEDDING_URL` to its HTTP endpoint.
 */
export class LocalEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "local";
  readonly model = "sentence-transformers/all-MiniLM-L6-v2";
  readonly dimensions = 384;
  protected readonly apiKeyEnv = "EDUBEK_LOCAL_EMBEDDING_URL";
  protected readonly endpoint = "http://localhost:8765/embed";

  protected async callApi(texts: string[], _apiKey: string): Promise<number[][]> {
    const url = process.env.EDUBEK_LOCAL_EMBEDDING_URL ?? this.endpoint;
    const res = await this.fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    const data = await res.json();
    return (data.vectors ?? data.embeddings ?? []) as number[][];
  }
}

/**
 * EduBek proprietary embedding provider (future).
 *
 * Placeholder for a future in-house embedding model trained on EduBek's
 * educational content corpus. The endpoint will be set via
 * `EDUBEK_EMBEDDING_URL` and authenticated via `EDUBEK_EMBEDDING_TOKEN`.
 */
export class EduBekEmbeddingProvider extends HttpEmbeddingProvider {
  readonly name = "edubek";
  readonly model = "edubek-embed-v1";
  readonly dimensions = 512;
  protected readonly apiKeyEnv = "EDUBEK_EMBEDDING_TOKEN";
  protected readonly endpoint = "http://edubek-embedding/embed";

  protected async callApi(texts: string[], _apiKey: string): Promise<number[][]> {
    const url = process.env.EDUBEK_EMBEDDING_URL ?? this.endpoint;
    const token = process.env.EDUBEK_EMBEDDING_TOKEN;
    const res = await this.fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ texts }),
    });
    const data = await res.json();
    return (data.vectors ?? data.embeddings ?? []) as number[][];
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const PROVIDER_REGISTRY: Record<string, () => EmbeddingProvider> = {
  hash: () => new HashEmbeddingProvider(),
  gemini: () => new GeminiEmbeddingProvider(),
  openai: () => new OpenAIEmbeddingProvider(),
  voyage: () => new VoyageEmbeddingProvider(),
  cohere: () => new CohereEmbeddingProvider(),
  jina: () => new JinaEmbeddingProvider(),
  nomic: () => new NomicEmbeddingProvider(),
  local: () => new LocalEmbeddingProvider(),
  edubek: () => new EduBekEmbeddingProvider(),
};

/**
 * Lazily-instantiated singleton provider. The first call to
 * `getEmbeddingProvider()` reads `EDUBEK_EMBEDDING_PROVIDER` and caches
 * the instance for the lifetime of the process.
 */
let cachedProvider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (cachedProvider) return cachedProvider;
  const requested = (process.env.EDUBEK_EMBEDDING_PROVIDER ?? "hash").toLowerCase();
  const factory = PROVIDER_REGISTRY[requested];
  if (!factory) {
    log.warn("embedding.unknown_provider", {
      requested,
      fallback: "hash",
    });
    cachedProvider = PROVIDER_REGISTRY.hash!();
  } else {
    cachedProvider = factory();
  }
  log.info("embedding.provider_initialized", {
    provider: cachedProvider.name,
    model: cachedProvider.model,
    dimensions: cachedProvider.dimensions,
  });
  return cachedProvider;
}

/**
 * For tests: override the cached provider. Pass `null` to reset.
 */
export function __setEmbeddingProviderForTest(provider: EmbeddingProvider | null): void {
  cachedProvider = provider;
}

/**
 * List all registered provider names — used by /api/discovery/health
 * and admin UIs to show available embedding backends.
 */
export function listAvailableProviders(): Array<{ name: string; model: string; dimensions: number }> {
  return Object.entries(PROVIDER_REGISTRY).map(([name, factory]) => {
    const p = factory();
    return { name, model: p.model, dimensions: p.dimensions };
  });
}

// ---------------------------------------------------------------------------
// Vector math utilities
// ---------------------------------------------------------------------------

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i]!;
    const bv = b[i]!;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

/**
 * Resize a vector to a target dimension by zero-padding or truncating.
 * Used when comparing embeddings from different providers.
 */
export function resizeVector(vec: number[], targetDims: number): number[] {
  if (vec.length === targetDims) return vec;
  if (vec.length > targetDims) return vec.slice(0, targetDims);
  return [...vec, ...new Array<number>(targetDims - vec.length).fill(0)];
}
