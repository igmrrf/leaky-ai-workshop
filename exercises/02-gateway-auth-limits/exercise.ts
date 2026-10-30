// EXERCISE 02 · Gateway auth + rate limit + input caps    slide 10: "One gateway. Every control lives there."
// Run: npm run test:02        Reference: ./solution.ts
//
// Every request to the model passes through check(). Return { ok: false, status, error }
// for the FIRST failing control, in this order:
//
//   1. 401 'UNAUTHENTICATED'   no "Bearer <token>" or verifySession() returns null
//   2. 429 'RATE_LIMITED'      more than maxRequestsPerWindow requests from this userId
//                              inside one windowMs (a simple fixed window per user is fine)
//   3. 400 'INVALID_INPUT'     message is not a non-empty string, or document is present
//                              but not a string
//   4. 413 'INPUT_TOO_LARGE'   message.length + document.length > maxInputChars
//
// Otherwise return { ok: true, userId, message, document } (document defaults to '').
import { bearer, verifySession } from '../../src/lib/session.ts';
import type { GatewayGuard, GuardConfig } from './types.ts';

export function createGatewayGuard(config: GuardConfig): GatewayGuard {
  void config;
  void bearer;
  void verifySession;
  return {
    check() {
      throw new Error('TODO(02): implement the gateway guard');
    },
  };
}
