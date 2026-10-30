// ✅ EXERCISE 08 solution. One character class: add _ and -.
export const SECRET_PATTERN = /sk-[a-zA-Z0-9_-]{16,}/g;

export function scanForSecrets(text: string): string[] {
  return text.match(SECRET_PATTERN) ?? [];
}
