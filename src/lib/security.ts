/**
 * Shared security helpers for public-facing handling of untrusted input.
 *
 * Covers: HTML escaping (prevents injection into email HTML and into the
 * map popup DOM that is built via innerHTML), https-URL validation for
 * user/CMS-supplied image URLs, best-effort per-IP rate limiting to blunt
 * spam/abuse, and proxy-aware client-IP extraction.
 */

/** Escape HTML-significant characters before interpolating untrusted input into HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Return the value only if it is a safe absolute https: URL, otherwise null.
 * Blocks javascript:, data:, http: and other schemes that could smuggle
 * script or mixed content into an <img src> built via innerHTML.
 */
export function safeHttpsUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Return a safe <img src> value: either an absolute https: URL, or a
 * same-origin relative path under /projects/ with an image extension.
 * Everything else (javascript:, data:, http:, traversal) returns null.
 * Used for the map popup img built via innerHTML.
 */
export function safeImageSrc(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\/projects\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(raw)) {
    return raw;
  }
  return safeHttpsUrl(raw);
}

/** Pull the best-guess client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Best-effort in-memory sliding-window rate limit, keyed by IP + route.
 *
 * Note: serverless instances each hold their own memory, so this catches
 * bursts against a warm instance rather than a distributed flood. For
 * production-grade limiting, back this with a shared store (Upstash/Vercel
 * KV). It is a meaningful zero-dependency layer in the meantime.
 *
 * @returns true if the request is allowed, false if it should be rejected (429).
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
