export interface IssueParams {
  secret: string;
  userId: string;
  action: string; // e.g. 'execute_wire_transfer'
  args: Record<string, unknown>; // the EXACT arguments the human approved
  now: number;
  ttlMs?: number; // default 60_000
}

export interface VerifyParams {
  secret: string;
  ticket: string | undefined;
  userId: string;
  action: string;
  args: Record<string, unknown>; // the arguments the tool is ABOUT to run with
  now: number;
  usedJtis: Set<string>; // tickets already spent (in production: Redis SET with TTL)
}

export type VerifyReason =
  | 'MISSING'
  | 'MALFORMED'
  | 'BAD_SIGNATURE'
  | 'EXPIRED'
  | 'WRONG_USER'
  | 'WRONG_ACTION'
  | 'ARGUMENTS_TAMPERED'
  | 'REPLAYED';

export type Verdict = { ok: true } | { ok: false; reason: VerifyReason };

/** What the server signs. */
export interface TicketPayload {
  jti: string; // unique id, single use
  sub: string; // user id
  act: string; // action
  argsHash: string; // sha256(canonicalJson(args))
  exp: number; // epoch ms
}
