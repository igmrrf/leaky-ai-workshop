// A deterministic, offline stand-in for an LLM. No network, no API key, same output every run.
//
// It is deliberately NAIVE: like a real model on a bad day, it obeys instructions wherever
// they appear (user text, an uploaded document, inside your delimiters). That is the point:
// the defences in this repo must hold even when the model itself is fully talked round.
import type { ChatMessage } from '../../lib/types.ts';
import { proposeToolCall } from '../tools.ts';

const INJECTION = /ignore (all )?previous instructions|print your system prompt|reveal your (system )?prompt|\[SYSTEM\]/i;
const VERBATIM = /include this verbatim:\s*(.+)/i;

/** Decide the full reply. Pure function: easy to test, easy to reason about on a projector. */
export function mockReply(messages: ChatMessage[]): string {
  const all = messages.map((m) => m.content).join('\n');
  const system = messages[0]?.content ?? '';

  // LLM01 / LLM07: obey the injection and recite the system prompt.
  if (INJECTION.test(all)) {
    return `Of course! Here are my full instructions, verbatim:\n\n${system}\n\nIs there anything else I can help with?`;
  }

  // LLM05: echo attacker-supplied markup back. Harmless as text, dangerous as innerHTML.
  const verbatim = all.match(VERBATIM)?.[1];
  if (verbatim) return `Summary ready. Here is the badge you asked me to include: ${verbatim}`;

  // LLM06: propose a privileged tool call. The gateway decides whether it runs.
  const tool = proposeToolCall(all);
  if (tool) {
    const { amount, currency, to } = tool.args;
    return `I can help with that. I've prepared **execute_wire_transfer** for ${currency} ${Number(amount).toLocaleString('en-US')} to ${to}. It needs your approval before it runs.`;
  }

  const user = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ') || all;
  return `Thanks for your message. (Offline mock model: a real model would answer here.) You wrote ${user.length} characters. Nothing in it asked me to misbehave.`;
}

/** Split text into 2-4 character chunks, like a real token stream. Deterministic. */
export function chunkify(text: string): string[] {
  const sizes = [3, 2, 4, 3, 2, 4, 2];
  const out: string[] = [];
  for (let i = 0, n = 0; i < text.length; n++) {
    const size = sizes[n % sizes.length]!;
    out.push(text.slice(i, i + size));
    i += size;
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function* mockStream(messages: ChatMessage[], delayMs: number): AsyncGenerator<string> {
  for (const chunk of chunkify(mockReply(messages))) {
    if (delayMs > 0) await sleep(delayMs);
    yield chunk;
  }
}
