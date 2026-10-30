// ❌ Slide 15: "Direct is noisy. Indirect is the one that gets you."
// Raw concatenation: user text and an attacker's document land INSIDE the system prompt,
// with exactly the same authority as the instructions you wrote.
import type { ChatMessage, PromptInput } from './types.ts';

export function buildMessages({ system, userText, document }: PromptInput): ChatMessage[] {
  return [{ role: 'system', content: `${system}\n\nUser says: ${userText}\n\nDocument: ${document ?? ''}` }];
}
