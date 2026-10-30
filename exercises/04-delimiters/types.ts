import type { ChatMessage } from '../../src/lib/types.ts';
export type { ChatMessage };

export interface PromptInput {
  system: string; // trusted: written by you
  userText: string; // untrusted: typed by the user
  document?: string; // untrusted: uploaded / retrieved (RAG, email, CV...). The indirect channel.
}
