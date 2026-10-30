// ❌ Slide: "My own secret scanner reported a clean tree."
// No hyphen in the character class. "sk-prod-FAKE99214810294": the run after "sk-" stops at
// "prod" (4 chars) because of the next hyphen, so {16,} never reaches its minimum.
export const SECRET_PATTERN = /sk-[a-zA-Z0-9]{16,}/g;

export function scanForSecrets(text: string): string[] {
  return text.match(SECRET_PATTERN) ?? [];
}
