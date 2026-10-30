// ✅ EXERCISE 05 solution. Rolling window across chunk boundaries.
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
