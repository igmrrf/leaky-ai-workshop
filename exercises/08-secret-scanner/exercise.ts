// EXERCISE 08 · Test your scanner against a planted secret   slides 18-19: "My own secret scanner reported a clean tree."
// Run: npm run test:08        Reference: ./solution.ts     Also try: npm run scan:secrets
//
// The buggy pattern lives in ./vulnerable.ts:  /sk-[a-zA-Z0-9]{16,}/g
// TODO: fix the character class so real-world key shapes (sk-proj-..., sk-prod-..., sk-live_...)
// are found, then return every match in `text` (an empty array when clean).
// Then read the test: it plants a fake secret and asserts the scanner catches it. That test,
// in CI, is the actual control.
export const SECRET_PATTERN = /TODO/g;

export function scanForSecrets(text: string): string[] {
  void text;
  throw new Error('TODO(08): fix the pattern and return the matches');
}
