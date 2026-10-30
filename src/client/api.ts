// Thin client for the gateway. The browser never sees a provider key: only our session.
export type Mode = 'vulnerable' | 'hardened';
export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}
export type StreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'tool'; call: ToolCall }
  | { type: 'killed'; reason: string }
  | { type: 'done' };

const SESSION_KEY = 'leaky.session';

// ⚠️ localStorage is readable by ANY script on the page, which is exactly what the LLM05
// demo steals. Production: an httpOnly, Secure, SameSite cookie the page can't read.
export async function ensureSession(): Promise<string> {
  const res = await fetch('/api/session', { method: 'POST' });
  const { token } = (await res.json()) as { token: string };
  localStorage.setItem(SESSION_KEY, token);
  return token;
}

const headers = (mode: Mode, extra: Record<string, string> = {}): Record<string, string> => ({
  'content-type': 'application/json',
  'x-demo-mode': mode, // DEMO ONLY
  authorization: `Bearer ${localStorage.getItem(SESSION_KEY) ?? ''}`,
  ...extra,
});

/** POST /api/chat and yield NDJSON events as they arrive. */
export async function* streamChat(mode: Mode, message: string, document?: string): AsyncGenerator<StreamEvent> {
  const res = await fetch('/api/chat', { method: 'POST', headers: headers(mode), body: JSON.stringify({ message, document }) });
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(`${res.status} ${err.error ?? res.statusText}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffered = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    const lines = buffered.split('\n');
    buffered = lines.pop() ?? '';
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as StreamEvent;
  }
}

export async function callTool(mode: Mode, call: ToolCall, ticket?: string) {
  const res = await fetch('/api/tool', {
    method: 'POST',
    headers: headers(mode, ticket ? { 'x-mfa-ticket': ticket } : {}),
    body: JSON.stringify({ toolName: call.name, args: call.args }),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

/** Hardened: the SERVER signs a ticket bound to user + action + sha256(args), 60s, single use. */
export async function requestServerTicket(call: ToolCall): Promise<string> {
  const res = await fetch('/api/step-up', {
    method: 'POST',
    headers: headers('hardened'),
    body: JSON.stringify({ approved: true, action: call.name, args: call.args }),
  });
  if (!res.ok) throw new Error(`step-up failed: ${res.status}`);
  return ((await res.json()) as { ticket: string }).ticket;
}

export async function fetchAudit() {
  const res = await fetch('/api/audit');
  return (await res.json()) as Array<{ id: number; ts: string; mode: Mode; userId: string; event: string; detail?: string }>;
}
