// Ace_IT/lib/rateLimiter.ts

type RateLimitStore = {
  [key: string]: { count: number; lastRequest: number };
};

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

export function rateLimit(key: string): boolean {
  const now = Date.now();
  if (!store[key] || now - store[key].lastRequest > WINDOW_MS) {
    store[key] = { count: 1, lastRequest: now };
    return false; // Not rate limited
  }
  store[key].count += 1;
  store[key].lastRequest = now;
  if (store[key].count > MAX_ATTEMPTS) {
    return true; // Rate limited
  }
  return false;
} 