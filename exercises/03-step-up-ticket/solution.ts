// ✅ EXERCISE 03 solution. Signed, bound, expiring, single-use.
import { b64url, canonicalJson, fromB64url, hmac, newId, safeEqual, sha256Hex } from '../../src/lib/crypto.ts';
import type { IssueParams, TicketPayload, Verdict, VerifyParams } from './types.ts';

const hashArgs = (args: Record<string, unknown>): string => sha256Hex(canonicalJson(args));

export function issueStepUpTicket({ secret, userId, action, args, now, ttlMs = 60_000 }: IssueParams): string {
  const payload: TicketPayload = {
    jti: newId(), // single use: the server remembers spent jtis
    sub: userId, // bound to the person who approved
    act: action, // bound to the tool
    argsHash: hashArgs(args), // bound to the EXACT arguments
    exp: now + ttlMs, // short-lived: 60s is plenty for a passkey prompt
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${hmac(secret, body)}`;
}

export function verifyStepUpTicket({ secret, ticket, userId, action, args, now, usedJtis }: VerifyParams): Verdict {
  if (!ticket) return { ok: false, reason: 'MISSING' };

  const [body, sig, extra] = ticket.split('.');
  if (!body || !sig || extra !== undefined) return { ok: false, reason: 'MALFORMED' };

  // Signature first: nothing inside an unsigned payload deserves to be read.
  if (!safeEqual(sig, hmac(secret, body))) return { ok: false, reason: 'BAD_SIGNATURE' };

  let p: TicketPayload;
  try {
    p = JSON.parse(fromB64url(body)) as TicketPayload;
  } catch {
    return { ok: false, reason: 'MALFORMED' };
  }

  if (p.exp <= now) return { ok: false, reason: 'EXPIRED' };
  if (p.sub !== userId) return { ok: false, reason: 'WRONG_USER' };
  if (p.act !== action) return { ok: false, reason: 'WRONG_ACTION' };
  if (p.argsHash !== hashArgs(args)) return { ok: false, reason: 'ARGUMENTS_TAMPERED' };
  if (usedJtis.has(p.jti)) return { ok: false, reason: 'REPLAYED' };

  usedJtis.add(p.jti); // spend it only after every other check passed
  return { ok: true };
}
