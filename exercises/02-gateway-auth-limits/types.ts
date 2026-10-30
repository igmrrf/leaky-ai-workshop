export interface GuardConfig {
  sessionSecret: string;
  maxRequestsPerWindow: number; // e.g. 30
  windowMs: number; // e.g. 60_000
  maxInputChars: number; // e.g. 4_000 (message + document)
}

export interface GuardInput {
  authorization: string | undefined; // the raw "Authorization" header
  message: unknown; // untrusted JSON from the client
  document?: unknown;
  now: number;
}

export type GuardResult =
  | { ok: true; userId: string; message: string; document: string }
  | { ok: false; status: 400 | 401 | 413 | 429; error: string };

export interface GatewayGuard {
  check(input: GuardInput): GuardResult;
}
