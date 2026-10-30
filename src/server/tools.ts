// The tools the assistant can PROPOSE. Least privilege: an allow-list, validated arguments,
// and every state-changing tool behind a human (see exercise 03).
import type { ToolCall } from '../lib/types.ts';
import { newId } from '../lib/crypto.ts';

const TRANSFER = /(?:transfer|wire|send|pay)[^$]*\$\s?([\d,]+(?:\.\d+)?)/i;
const ACCOUNT = /ACC-[A-Z0-9-]+/;

/** Deterministic "the model wants to call a tool" detection, used for both the mock and Ollama. */
export function proposeToolCall(text: string): ToolCall | null {
  const amount = text.match(TRANSFER)?.[1];
  if (!amount) return null;
  return {
    name: 'execute_wire_transfer',
    args: { amount: Number(amount.replace(/,/g, '')), currency: 'USD', to: text.match(ACCOUNT)?.[0] ?? 'ACC-FAKE-0042' },
  };
}

export const ALLOWED_TOOLS = new Set(['execute_wire_transfer']);

/** Hardened-mode argument validation. Never let the model choose the shape of a money movement. */
export function validateToolArgs(name: string, args: unknown): string | null {
  if (!ALLOWED_TOOLS.has(name)) return 'UNKNOWN_TOOL';
  const a = args as Record<string, unknown> | null;
  if (!a || typeof a !== 'object') return 'INVALID_ARGS';
  if (typeof a.amount !== 'number' || !(a.amount > 0) || a.amount > 1_000_000) return 'INVALID_ARGS';
  if (typeof a.to !== 'string' || !ACCOUNT.test(a.to)) return 'INVALID_ARGS';
  if (a.currency !== 'USD') return 'INVALID_ARGS';
  return null;
}

/** Pretend to move money. Nothing real happens here, ever. */
export function executeTool(call: ToolCall) {
  return { status: 'EXECUTED' as const, transferId: `TX-FAKE-${newId().slice(0, 8)}`, ...call.args };
}
