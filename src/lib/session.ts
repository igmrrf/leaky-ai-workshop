// A deliberately tiny "JWT-shaped" session token: base64url(payload).hmac
// In production use your identity provider's JWTs and verify iss/aud/exp.
// The point for the workshop: the server SIGNS it, so the client can't mint one.
import { b64url, fromB64url, hmac, safeEqual } from './crypto.ts';

export interface Session {
  sub: string; // user id
  exp: number; // epoch ms
}

export function issueSession(secret: string, userId: string, now = Date.now(), ttlMs = 60 * 60 * 1000): string {
  const payload = b64url(JSON.stringify({ sub: userId, exp: now + ttlMs } satisfies Session));
  return `${payload}.${hmac(secret, payload)}`;
}

/** Returns the session if the signature is valid and it has not expired, else null. */
export function verifySession(secret: string, token: string | undefined, now = Date.now()): Session | null {
  if (!token) return null;
  const [payload, sig, extra] = token.split('.');
  if (!payload || !sig || extra !== undefined) return null;
  if (!safeEqual(sig, hmac(secret, payload))) return null;
  try {
    const session = JSON.parse(fromB64url(payload)) as Session;
    if (typeof session.sub !== 'string' || typeof session.exp !== 'number') return null;
    return session.exp > now ? session : null;
  } catch {
    return null;
  }
}

/** "Bearer abc" -> "abc" */
export const bearer = (header: string | undefined): string | undefined =>
  header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : undefined;
