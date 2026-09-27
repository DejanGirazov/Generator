// Exponential backoff with full jitter, capped at maxMs. Used to space out
// reconnect attempts so a backend restart doesn't get hammered by a
// generator retrying every 100ms.

export function createBackoff(baseMs = 500, maxMs = 30_000) {
  let attempt = 0;

  function next(): number {
    const exp = Math.min(maxMs, baseMs * 2 ** attempt);
    attempt += 1;
    return Math.floor(Math.random() * exp);
  }

  function reset(): void {
    attempt = 0;
  }

  return { next, reset };
}