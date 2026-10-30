// EXERCISE 01 · Key in the bundle               slide 6: "The one-line audit"
// Run: npm run test:01        Reference: ./solution.ts
//
// vite.config.ts calls this guard at build time with every env var. Make the BUILD
// refuse to ship a secret to the browser, so the mistake can never reach production.
//
// TODO: throw an Error (listing the offending variable NAMES, never their values) if
// any variable that starts with `VITE_` or `NEXT_PUBLIC_`:
//   1. has a secret-sounding name: KEY, SECRET, TOKEN, PASSWORD or PRIVATE (any case), or
//   2. has a value that looks like a provider key:  sk-[a-zA-Z0-9_-]{16,}
// Variables WITHOUT a public prefix are server-only and must be ignored.
export function assertNoSecretsInClientEnv(env: Record<string, string | undefined>): void {
  void env;
  throw new Error('TODO(01): implement assertNoSecretsInClientEnv');
}
