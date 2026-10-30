// ✅ EXERCISE 05 · Canary rolling window — solved on branch step-05 (see ./solution.ts)
export function createCanaryMonitor(token: string) {
  let tail = ''; // keeps token.length - 1 chars of history
  return {
    inspect(chunk: string): boolean {
      const window = tail + chunk;
      if (window.includes(token)) return true;
      tail = window.slice(-(token.length - 1));
      return false;
    },
  };
}
