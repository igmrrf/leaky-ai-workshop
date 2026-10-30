// ✅ EXERCISE 08 · Test your scanner against a planted secret — solved on branch step-08 (see ./solution.ts)
export const SECRET_PATTERN = /sk-[a-zA-Z0-9_-]{16,}/g;

export function scanForSecrets(text: string): string[] {
  return text.match(SECRET_PATTERN) ?? [];
}
