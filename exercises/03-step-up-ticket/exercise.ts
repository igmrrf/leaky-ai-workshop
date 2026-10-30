// EXERCISE 03 · Step-up ticket                   slides 11-13: "Bind the approval to the exact action"
// Run: npm run test:03        Reference: ./solution.ts
//
// A step-up ticket proves "THIS user approved THIS action with THESE arguments, just now, once".
// Signed, bound, expiring, single-use, or it is decoration.
//
// issueStepUpTicket: build a TicketPayload { jti: newId(), sub: userId, act: action,
//   argsHash: sha256Hex(canonicalJson(args)), exp: now + (ttlMs ?? 60_000) },
//   then return `${b64url(JSON.stringify(payload))}.${hmac(secret, thatB64Part)}`.
//
// verifyStepUpTicket: return the FIRST failure, in this order:
//   MISSING             no ticket
//   MALFORMED           not exactly "<payload>.<sig>", or payload isn't valid JSON
//   BAD_SIGNATURE       safeEqual(sig, hmac(secret, payload)) is false
//   EXPIRED             payload.exp <= now
//   WRONG_USER          payload.sub !== userId
//   WRONG_ACTION        payload.act !== action
//   ARGUMENTS_TAMPERED  payload.argsHash !== sha256Hex(canonicalJson(args))   <- approve $5, replay for $50,000
//   REPLAYED            usedJtis already has payload.jti
// Only when every check passes: add the jti to usedJtis and return { ok: true }.
import { b64url, canonicalJson, fromB64url, hmac, newId, safeEqual, sha256Hex } from '../../src/lib/crypto.ts';
import type { IssueParams, TicketPayload, Verdict, VerifyParams } from './types.ts';

// (imported for you; delete these lines once you use them)
void [b64url, canonicalJson, fromB64url, hmac, newId, safeEqual, sha256Hex];
export type { TicketPayload };

export function issueStepUpTicket(params: IssueParams): string {
  void params;
  throw new Error('TODO(03): sign a ticket bound to user + action + argsHash + expiry + jti');
}

export function verifyStepUpTicket(params: VerifyParams): Verdict {
  void params;
  throw new Error('TODO(03): verify signature, expiry, binding and single use');
}
