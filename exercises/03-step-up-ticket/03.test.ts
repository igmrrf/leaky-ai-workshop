import { describe, expect, it } from 'vitest';
import { pick, target } from '../pick.ts';
import * as exercise from './exercise.ts';
import * as solution from './solution.ts';
import * as vulnerable from './vulnerable.ts';

const { issueStepUpTicket, verifyStepUpTicket } = pick(exercise, solution);

const secret = 'FAKE-step-up-secret';
const now = 1_700_000_000_000;
const action = 'execute_wire_transfer';
const approved = { amount: 5, currency: 'USD', to: 'ACC-FAKE-0042' };
const base = { secret, userId: 'ada', action, now };
const issue = () => issueStepUpTicket({ ...base, args: approved });
const verify = (ticket: string | undefined, over: Partial<Parameters<typeof verifyStepUpTicket>[0]> = {}) =>
  verifyStepUpTicket({ ...base, ticket, args: approved, usedJtis: new Set(), ...over });

describe(`03 step-up ticket [${target}]`, () => {
  it("the vulnerable check accepts a ticket anyone can type (the bug)", () => {
    const v = vulnerable.verifyStepUpTicket({ ...base, ticket: 'MFA_PROOF_', args: { amount: 50_000 }, usedJtis: new Set() });
    expect(v.ok).toBe(true);
  });

  it('accepts a ticket the server issued for exactly this user, action and args', () => {
    expect(verify(issue())).toEqual({ ok: true });
  });

  it('rejects the forged MFA_PROOF_ ticket', () => {
    expect(verify('MFA_PROOF_')).toEqual({ ok: false, reason: 'MALFORMED' });
    expect(verify(undefined)).toEqual({ ok: false, reason: 'MISSING' });
  });

  it('rejects a ticket signed with the wrong secret', () => {
    const forged = issueStepUpTicket({ ...base, secret: 'attacker-guess', args: approved });
    expect(verify(forged)).toEqual({ ok: false, reason: 'BAD_SIGNATURE' });
  });

  it('approve $5, replay for $50,000 -> ARGUMENTS_TAMPERED', () => {
    expect(verify(issue(), { args: { ...approved, amount: 50_000 } })).toEqual({ ok: false, reason: 'ARGUMENTS_TAMPERED' });
  });

  it('key order does not matter (canonical JSON)', () => {
    expect(verify(issue(), { args: { to: 'ACC-FAKE-0042', currency: 'USD', amount: 5 } })).toEqual({ ok: true });
  });

  it('is bound to the user and the action', () => {
    expect(verify(issue(), { userId: 'mallory' })).toEqual({ ok: false, reason: 'WRONG_USER' });
    expect(verify(issue(), { action: 'delete_account' })).toEqual({ ok: false, reason: 'WRONG_ACTION' });
  });

  it('expires after the TTL (60s default)', () => {
    expect(verify(issue(), { now: now + 59_999 })).toEqual({ ok: true });
    expect(verify(issue(), { now: now + 60_000 })).toEqual({ ok: false, reason: 'EXPIRED' });
  });

  it('is single use (jti)', () => {
    const usedJtis = new Set<string>();
    const ticket = issue();
    expect(verify(ticket, { usedJtis })).toEqual({ ok: true });
    expect(verify(ticket, { usedJtis })).toEqual({ ok: false, reason: 'REPLAYED' });
  });

  it('a tampered attempt does not burn the ticket', () => {
    const usedJtis = new Set<string>();
    const ticket = issue();
    expect(verify(ticket, { usedJtis, args: { ...approved, amount: 50_000 } }).ok).toBe(false);
    expect(verify(ticket, { usedJtis })).toEqual({ ok: true });
  });
});
