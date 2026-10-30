// The gateway. ONE Hono app serves both modes so you can diff them side by side:
//   x-demo-mode: vulnerable  -> the bugs from the slides
//   x-demo-mode: hardened    -> the fixes (the default)
//
// ⚠️  DEMO ONLY. A real app never lets the client choose its own security posture via a header.
import { Hono, type Context } from 'hono';
import { stream } from 'hono/streaming';
import { newId } from '../lib/crypto.ts';
import { bearer, issueSession, verifySession } from '../lib/session.ts';
import { HIGH_RISK_TOOLS, type ChatMessage, type ToolCall } from '../lib/types.ts';
import { createAuditLog, type Mode } from './audit.ts';
import { buildSystemPrompt } from './model/system-prompt.ts';
import type { ModelStream } from './model/index.ts';
import { executeTool, proposeToolCall, validateToolArgs } from './tools.ts';

// Each mode is just a different set of modules. Same pipeline, different code.
import * as guardFixed from '../../exercises/02-gateway-auth-limits/solution.ts';
import * as ticketVuln from '../../exercises/03-step-up-ticket/vulnerable.ts';
import * as ticketFixed from '../../exercises/03-step-up-ticket/solution.ts';
import * as promptVuln from '../../exercises/04-delimiters/vulnerable.ts';
import * as promptFixed from '../../exercises/04-delimiters/solution.ts';
import * as canaryVuln from '../../exercises/05-canary-window/vulnerable.ts';
import * as canaryFixed from '../../exercises/05-canary-window/solution.ts';

export interface AppConfig {
  sessionSecret: string;
  stepUpSecret: string;
  rateLimitPerMinute: number;
  maxInputChars: number;
  model: ModelStream;
  modelName: string;
}

const DEMO_USER = 'demo-user';

export function createApp(cfg: AppConfig) {
  const app = new Hono();
  const audit = createAuditLog();
  const usedJtis = new Set<string>(); // production: Redis SET with TTL, shared by replicas
  const guard = guardFixed.createGatewayGuard({
    sessionSecret: cfg.sessionSecret,
    maxRequestsPerWindow: cfg.rateLimitPerMinute,
    windowMs: 60_000,
    maxInputChars: cfg.maxInputChars,
  });

  const modeOf = (c: Context): Mode => (c.req.header('x-demo-mode') === 'vulnerable' ? 'vulnerable' : 'hardened');
  const body = async (c: Context): Promise<Record<string, unknown>> => {
    try {
      const b: unknown = await c.req.json();
      return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };

  app.get('/api/health', (c) => c.json({ ok: true, model: cfg.modelName }));
  app.get('/api/audit', (c) => c.json(audit.list()));

  // Demo login: in production this is your identity provider. The point: the SERVER signs it.
  app.post('/api/session', (c) => {
    audit.record({ mode: 'hardened', userId: DEMO_USER, event: 'SESSION_ISSUED' });
    return c.json({ token: issueSession(cfg.sessionSecret, DEMO_USER), userId: DEMO_USER });
  });

  // ---------------------------------------------------------------- chat (streams NDJSON)
  app.post('/api/chat', async (c) => {
    const mode = modeOf(c);
    const b = await body(c);
    let userId = 'anonymous';
    let message: string;
    let document: string;

    if (mode === 'hardened') {
      // Exercise 02: auth, rate limit, input caps. Before a single token is paid for.
      const v = guard.check({ authorization: c.req.header('authorization'), message: b.message, document: b.document, now: Date.now() });
      if (!v.ok) {
        audit.record({ mode, userId, event: v.error });
        return c.json({ error: v.error }, v.status);
      }
      ({ userId, message, document } = v);
    } else {
      // ❌ No identity, no limits, no caps.
      message = String(b.message ?? '');
      document = String(b.document ?? '');
    }

    const canary = `CANARY-${newId()}`; // fresh per request
    const system = buildSystemPrompt(canary);
    // Exercise 04: concatenation (vulnerable) vs delimiters (hardened)
    const messages: ChatMessage[] = (mode === 'hardened' ? promptFixed : promptVuln).buildMessages({ system, userText: message, document });
    // Exercise 05: per-chunk check (vulnerable) vs rolling window (hardened)
    const monitor = (mode === 'hardened' ? canaryFixed : canaryVuln).createCanaryMonitor(canary);
    const tool = proposeToolCall(`${message}\n${document}`);
    audit.record({ mode, userId, event: 'CHAT', detail: `${message.length + document.length} chars${document ? ' + document' : ''}` });

    c.header('content-type', 'application/x-ndjson; charset=utf-8');
    c.header('cache-control', 'no-store');
    c.header('x-content-type-options', 'nosniff');
    return stream(c, async (s) => {
      const send = (e: object) => s.write(`${JSON.stringify(e)}\n`);
      for await (const chunk of cfg.model(messages)) {
        if (monitor.inspect(chunk)) {
          // Killswitch: drop this chunk, tell the client, stop generating (and paying).
          audit.record({ mode, userId, event: 'CANARY_TRIPPED', detail: 'system prompt leak: stream killed' });
          await send({ type: 'killed', reason: 'CANARY_TRIPPED' });
          return; // leaving for-await calls return() on the model stream
        }
        await send({ type: 'chunk', text: chunk });
      }
      if (tool) await send({ type: 'tool', call: tool });
      await send({ type: 'done' });
    });
  });

  // ---------------------------------------------------------------- step-up (hardened only)
  // In production this endpoint first verifies a WebAuthn/passkey assertion. The approval
  // modal in the UI stands in for that. What matters: the SERVER signs the ticket, bound to
  // user + action + sha256(args), 60s TTL, single-use jti.
  app.post('/api/step-up', async (c) => {
    const session = verifySession(cfg.sessionSecret, bearer(c.req.header('authorization')));
    if (!session) return c.json({ error: 'UNAUTHENTICATED' }, 401);
    const b = await body(c);
    if (b.approved !== true || typeof b.action !== 'string' || !b.args || typeof b.args !== 'object') {
      return c.json({ error: 'INVALID_INPUT' }, 400);
    }
    const args = b.args as Record<string, unknown>;
    const ticket = ticketFixed.issueStepUpTicket({ secret: cfg.stepUpSecret, userId: session.sub, action: b.action, args, now: Date.now() });
    audit.record({ mode: 'hardened', userId: session.sub, event: 'STEP_UP_ISSUED', detail: `${b.action} ${JSON.stringify(args)}` });
    return c.json({ ticket, expiresInMs: 60_000 });
  });

  // ---------------------------------------------------------------- tool execution
  app.post('/api/tool', async (c) => {
    const mode = modeOf(c);
    const b = await body(c);
    const call: ToolCall = { name: String(b.toolName ?? ''), args: (b.args ?? {}) as Record<string, unknown> };
    const ticket = c.req.header('x-mfa-ticket');
    let userId = 'anonymous';

    if (mode === 'hardened') {
      const session = verifySession(cfg.sessionSecret, bearer(c.req.header('authorization')));
      if (!session) return c.json({ error: 'UNAUTHENTICATED' }, 401);
      userId = session.sub;
      const invalid = validateToolArgs(call.name, call.args); // least privilege: allow-list + shape
      if (invalid) return c.json({ error: invalid }, 400);
    }

    if (HIGH_RISK_TOOLS.has(call.name)) {
      const impl = mode === 'hardened' ? ticketFixed : ticketVuln;
      const verdict = impl.verifyStepUpTicket({
        secret: cfg.stepUpSecret, ticket, userId, action: call.name, args: call.args, now: Date.now(), usedJtis,
      });
      if (!verdict.ok) {
        audit.record({ mode, userId, event: ticket ? 'TICKET_REJECTED' : 'STEP_UP_REQUIRED', detail: verdict.reason });
        return c.json({ error: 'STEP_UP_MFA_REQUIRED', reason: verdict.reason }, 403);
      }
    }

    const result = executeTool(call);
    audit.record({ mode, userId, event: 'TOOL_EXECUTED', detail: `${call.name} ${JSON.stringify(call.args)}` });
    return c.json(result);
  });

  return app;
}
