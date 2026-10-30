// In-memory audit trail. "Every request has a name attached to it."
// Production: append-only storage, shipped off-box, and NEVER the prompt/completion bodies (PII).
export type Mode = 'vulnerable' | 'hardened';

export interface AuditEntry {
  id: number;
  ts: string;
  mode: Mode;
  userId: string;
  event: string;
  detail?: string;
}

export function createAuditLog(max = 200) {
  const entries: AuditEntry[] = [];
  let id = 0;
  return {
    record(e: Omit<AuditEntry, 'id' | 'ts'>): void {
      entries.unshift({ id: ++id, ts: new Date().toISOString(), ...e });
      entries.length = Math.min(entries.length, max);
    },
    list(limit = 50): AuditEntry[] {
      return entries.slice(0, limit);
    },
  };
}
export type AuditLog = ReturnType<typeof createAuditLog>;
