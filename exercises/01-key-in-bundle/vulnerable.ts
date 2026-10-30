// ❌ Slide 6: "The one-line audit"
//
// The vulnerable app reads its provider key from `import.meta.env.VITE_OPENAI_API_KEY`.
// The VITE_ prefix is not a naming convention. It is a BUILD DIRECTIVE:
// "take this value and paste it into the JavaScript I serve to every visitor".
//
// Its "env guard" therefore checks nothing at all.
export function assertNoSecretsInClientEnv(_env: Record<string, string | undefined>): void {
  // nothing to see here
}
