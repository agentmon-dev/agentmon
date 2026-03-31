/**
 * Simple in-memory sliding window rate limiter.
 * Resets on cold start (serverless), but provides basic protection.
 * For production, swap with Vercel KV or Upstash Redis.
 */

interface WindowEntry {
	count: number;
	resetAt: number;
}

const windows = new Map<string, WindowEntry>();

export function checkRateLimit(
	key: string,
	limit: number = 60,
	windowMs: number = 60_000,
): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const entry = windows.get(key);

	if (!entry || now >= entry.resetAt) {
		windows.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
	}

	entry.count += 1;

	if (entry.count > limit) {
		return { allowed: false, remaining: 0, resetAt: entry.resetAt };
	}

	return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
