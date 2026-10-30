// ❌ Slide: "A ticket your client can construct is not a control."
// Real code, from a real reference implementation. The speaker's own.
import type { IssueParams, Verdict, VerifyParams } from './types.ts';

// The CLIENT made these: `MFA_PROOF_${Date.now()}`. Nothing is signed or bound.
export function issueStepUpTicket(_p: IssueParams): string {
  return `MFA_PROOF_${Date.now()}`;
}

export function verifyStepUpTicket({ ticket }: VerifyParams): Verdict {
  // The entire authorization check is a string prefix the attacker controls.
  //   curl -H 'x-mfa-ticket: MFA_PROOF_' ...  ->  {"status":"EXECUTED"}
  if (!ticket?.startsWith('MFA_PROOF_')) return { ok: false, reason: 'MISSING' };
  return { ok: true };
}
