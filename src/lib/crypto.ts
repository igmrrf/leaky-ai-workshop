// Small, boring crypto helpers shared by the gateway and the exercises.
// Everything here is Node's built-in `node:crypto`: no dependencies to audit.
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const b64url = (input: string | Buffer): string => Buffer.from(input).toString('base64url');
export const fromB64url = (input: string): string => Buffer.from(input, 'base64url').toString('utf8');

/** HMAC-SHA256, base64url. The server is the only party that knows `secret`. */
export const hmac = (secret: string, data: string): string =>
  createHmac('sha256', secret).update(data).digest('base64url');

export const sha256Hex = (data: string): string => createHash('sha256').update(data).digest('hex');

/** Constant-time string compare, so an attacker can't learn a signature byte by byte. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * JSON with sorted keys. `{amount:5, to:"x"}` and `{to:"x", amount:5}` must hash
 * the same, or a harmless key reorder looks like tampering (and vice versa).
 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export const newId = (): string => randomUUID();
