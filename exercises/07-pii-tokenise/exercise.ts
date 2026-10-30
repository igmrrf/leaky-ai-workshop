// EXERCISE 07 · PII tokenise -> cloud -> rehydrate   slide 22: "Keep identifiers home. Rent only the reasoning."
// Run: npm run test:07        Reference: ./solution.ts
//
// The local bridge (in production: a 3B local model + Presidio) swaps identifiers for
// surrogates, the cloud model reasons over structure only, and we swap the real values back.
//
// TODO tokenise(text): replace each match with a numbered surrogate, re-using the SAME
// surrogate when the same value appears twice. Apply patterns in this order:
//   EMAIL  [^\s@]+@[^\s@]+\.[a-z]{2,}           -> [EMAIL_1], [EMAIL_2] ...
//   PHONE  (\+234|0)[789][01]\d{8}  (Nigerian)  -> [PHONE_1] ...
//   ID     \b\d{11}\b  (BVN / NIN)               -> [ID_1] ...
//   ACCT   \b\d{10}\b  (NUBAN account)           -> [ACCT_1] ...
// TODO rehydrate(text, vault): put the real values back.
// TODO hybridAnswer(text, cloud): tokenise -> cloud(tokenised.text) -> rehydrate.
//
// Regex is a FIRST PASS. It cannot read context and will miss names. Say so out loud.
import type { CloudModel, Tokenised, Vault } from './types.ts';

export function tokenise(text: string): Tokenised {
  void text;
  throw new Error('TODO(07): swap PII for surrogates');
}

export function rehydrate(text: string, vault: Vault): string {
  void text;
  void vault;
  throw new Error('TODO(07): swap surrogates back');
}

export async function hybridAnswer(userText: string, cloud: CloudModel): Promise<string> {
  void userText;
  void cloud;
  throw new Error('TODO(07): tokenise -> cloud -> rehydrate');
}
