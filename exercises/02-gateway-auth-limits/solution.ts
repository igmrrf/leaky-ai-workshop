// ✅ EXERCISE 02 solution. One choke point: identity, budget, and shape, before any token is spent.
import { bearer, verifySession } from '../../src/lib/session.ts';
import type { GatewayGuard, GuardConfig } from './types.ts';

export function createGatewayGuard(config: GuardConfig): GatewayGuard {
  // Fixed window per user. In production this lives in Redis so every replica shares it.
  const windows = new Map<string, { start: number; count: number }>();

  return {
    check({ authorization, message, document, now }) {
      // 1. Who is this? A request without a name attached cannot be limited or audited.
      const session = verifySession(config.sessionSecret, bearer(authorization), now);
      if (!session) return { ok: false, status: 401, error: 'UNAUTHENTICATED' };

      // 2. Unbounded consumption (LLM10): an unlimited endpoint is an unlimited invoice.
      const w = windows.get(session.sub);
      if (!w || now - w.start >= config.windowMs) {
        windows.set(session.sub, { start: now, count: 1 });
      } else if (++w.count > config.maxRequestsPerWindow) {
        return { ok: false, status: 429, error: 'RATE_LIMITED' };
      }

      // 3. Shape: never trust that the JSON is what the UI meant to send.
      if (typeof message !== 'string' || message.trim() === '') {
        return { ok: false, status: 400, error: 'INVALID_INPUT' };
      }
      if (document !== undefined && typeof document !== 'string') {
        return { ok: false, status: 400, error: 'INVALID_INPUT' };
      }
      const doc = document ?? '';

      // 4. Size caps bound both cost and the room an attacker has to work in.
      if (message.length + doc.length > config.maxInputChars) {
        return { ok: false, status: 413, error: 'INPUT_TOO_LARGE' };
      }

      return { ok: true, userId: session.sub, message, document: doc };
    },
  };
}
