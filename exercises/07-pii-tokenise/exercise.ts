// ✅ EXERCISE 07 · PII tokenise -> cloud -> rehydrate — solved on branch step-07 (see ./solution.ts)
import type { CloudModel, Tokenised, Vault } from './types.ts';

// Order matters: a phone number contains 11 digits, so PHONE must run before ID.
const PATTERNS: Array<[label: string, re: RegExp]> = [
  ['EMAIL', /[^\s@]+@[^\s@]+\.[a-z]{2,}/gi],
  ['PHONE', /(?:\+234|0)[789][01]\d{8}/g],
  ['ID', /\b\d{11}\b/g], // BVN / NIN
  ['ACCT', /\b\d{10}\b/g], // NUBAN
];

export function tokenise(text: string): Tokenised {
  const vault: Vault = new Map();
  const byValue = new Map<string, string>(); // same value -> same surrogate
  const counters = new Map<string, number>();

  let out = text;
  for (const [label, re] of PATTERNS) {
    out = out.replace(re, (value) => {
      const existing = byValue.get(value);
      if (existing) return existing;
      const n = (counters.get(label) ?? 0) + 1;
      counters.set(label, n);
      const surrogate = `[${label}_${n}]`;
      byValue.set(value, surrogate);
      vault.set(surrogate, value);
      return surrogate;
    });
  }
  return { text: out, vault };
}

export function rehydrate(text: string, vault: Vault): string {
  let out = text;
  for (const [surrogate, value] of vault) out = out.split(surrogate).join(value);
  return out;
}

export async function hybridAnswer(userText: string, cloud: CloudModel): Promise<string> {
  const { text, vault } = tokenise(userText); // local: inside your infrastructure
  const answer = await cloud(text); // remote: sees surrogates only
  return rehydrate(answer, vault); // local again: the user sees real values
}
