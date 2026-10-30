// ❌ Slide 10: "One gateway. Every control lives there." The bug it fixes: the open inference endpoint.
// No identity, no limits, no caps. Every request is "anonymous" and unbounded:
// denial-of-wallet (OWASP LLM10) and zero audit trail.
import type { GatewayGuard, GuardConfig } from './types.ts';

export function createGatewayGuard(_config: GuardConfig): GatewayGuard {
  return {
    check: ({ message, document }) => ({
      ok: true,
      userId: 'anonymous',
      message: String(message ?? ''),
      document: String(document ?? ''),
    }),
  };
}
