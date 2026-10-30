import { describe, expect, it, vi } from 'vitest';
import { pick, target } from '../pick.ts';
import * as exercise from './exercise.ts';
import * as solution from './solution.ts';
import * as vulnerable from './vulnerable.ts';

const { tokenise, rehydrate, hybridAnswer } = pick(exercise, solution);

// All FAKE. Shapes only.
const email = 'ada.obi@example.com';
const phone = '+2348031234567';
const bvn = '22212345678';
const acct = '0123456789';
const input = `Customer ${email} (phone ${phone}, BVN ${bvn}) disputes a debit on account ${acct}. Email ${email} back.`;
const RAW = [email, phone, bvn, acct];

/** A "cloud model" that records everything it was sent, and answers using the surrogates. */
const fakeCloud = () => vi.fn(async (prompt: string) => `Draft reply to ${prompt.match(/\[EMAIL_1\]/)?.[0] ?? email}: refund on ${prompt.match(/\[ACCT_1\]/)?.[0] ?? acct} approved.`);

describe(`07 PII tokenise -> cloud -> rehydrate [${target}]`, () => {
  it('the vulnerable path ships raw PII across the border (the bug)', async () => {
    const cloud = fakeCloud();
    await vulnerable.hybridAnswer(input, cloud);
    for (const v of RAW) expect(cloud.mock.calls[0]?.[0]).toContain(v);
  });

  it('replaces every identifier with a typed surrogate', () => {
    const { text } = tokenise(input);
    for (const v of RAW) expect(text).not.toContain(v);
    expect(text).toContain('[EMAIL_1]');
    expect(text).toContain('[PHONE_1]');
    expect(text).toContain('[ID_1]');
    expect(text).toContain('[ACCT_1]');
  });

  it('re-uses the same surrogate for a repeated value', () => {
    const { text, vault } = tokenise(input);
    expect(text.match(/\[EMAIL_1\]/g)).toHaveLength(2);
    expect(text).not.toContain('[EMAIL_2]');
    expect(vault.get('[EMAIL_1]')).toBe(email);
  });

  it('rehydrate is the exact inverse', () => {
    const { text, vault } = tokenise(input);
    expect(rehydrate(text, vault)).toBe(input);
  });

  it('the cloud never sees raw PII, the user sees real values', async () => {
    const cloud = fakeCloud();
    const answer = await hybridAnswer(input, cloud);
    const sent = cloud.mock.calls[0]?.[0] ?? '';
    for (const v of RAW) expect(sent).not.toContain(v);
    expect(answer).toBe(`Draft reply to ${email}: refund on ${acct} approved.`);
  });
});
