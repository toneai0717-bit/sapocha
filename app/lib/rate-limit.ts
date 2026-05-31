type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const LIMIT = 10;
const WINDOW_MS = 60_000;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  store.set(ip, { ...entry, count: entry.count + 1 });
  return true;
}
