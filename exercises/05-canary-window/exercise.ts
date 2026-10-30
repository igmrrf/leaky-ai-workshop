// EXERCISE 05 · Canary rolling window             slides 16-17: "The canary check that never fires"
// Run: npm run test:05        Reference: ./solution.ts
//
// inspect() is called once per streamed chunk and must return true the moment the canary
// has appeared ANYWHERE in the stream so far, even when it is split across many chunks.
//
// TODO: keep a `tail` of the last (token.length - 1) characters seen. For each chunk:
//   window = tail + chunk; if window contains the token -> true; else update tail.
// (Nine lines. Do not keep the whole stream in memory: responses can be megabytes.)
export function createCanaryMonitor(token: string) {
  void token;
  return {
    inspect(chunk: string): boolean {
      void chunk;
      throw new Error('TODO(05): implement the rolling-window canary monitor');
    },
  };
}
