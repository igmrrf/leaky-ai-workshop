import { describe, expect, it } from 'vitest';
import { issueSession } from '../../src/lib/session.ts';
import { pick, target } from '../pick.ts';
import * as exercise from './exercise.ts';
import * as solution from './solution.ts';
import * as vulnerable from './vulnerable.ts';
import type { GuardConfig } from './types.ts';

const { createGatewayGuard } = pick(exercise, solution);
const config: GuardConfig = { sessionSecret: 'FAKE-test-secret', maxRequestsPerWindow: 3, windowMs: 60_000, maxInputChars: 100 };
const now = 1_700_000_000_000;
const auth = `Bearer ${issueSession(config.sessionSecret, 'ada', now)}`;

describe(`02 gateway auth + limits [${target}]`, () => {
  it('the vulnerable endpoint serves anyone, forever (the bug)', () => {
    const open = vulnerable.createGatewayGuard(config);
    for (let i = 0; i < 1000; i++) expect(open.check({ authorization: undefined, message: 'hi', now }).ok).toBe(true);
  });

  it('401 without a token', () => {
    expect(createGatewayGuard(config).check({ authorization: undefined, message: 'hi', now })).toMatchObject({ status: 401 });
  });

  it('401 with a forged or tampered token', () => {
    const forged = `Bearer ${issueSession('attacker-guess', 'ada', now)}`;
    expect(createGatewayGuard(config).check({ authorization: forged, message: 'hi', now })).toMatchObject({ status: 401 });
  });

  it('401 with an expired token', () => {
    const later = now + 2 * 60 * 60 * 1000;
    expect(createGatewayGuard(config).check({ authorization: auth, message: 'hi', now: later })).toMatchObject({ status: 401 });
  });

  it('accepts a valid session and names the user', () => {
    expect(createGatewayGuard(config).check({ authorization: auth, message: 'hi', now })).toEqual({
      ok: true, userId: 'ada', message: 'hi', document: '',
    });
  });

  it('429 after maxRequestsPerWindow, and recovers in the next window', () => {
    const guard = createGatewayGuard(config);
    for (let i = 0; i < 3; i++) expect(guard.check({ authorization: auth, message: 'hi', now }).ok).toBe(true);
    expect(guard.check({ authorization: auth, message: 'hi', now })).toMatchObject({ status: 429, error: 'RATE_LIMITED' });
    expect(guard.check({ authorization: auth, message: 'hi', now: now + 60_000 }).ok).toBe(true);
  });

  it('400 for non-string or empty input', () => {
    const guard = createGatewayGuard(config);
    expect(guard.check({ authorization: auth, message: { $gt: '' }, now })).toMatchObject({ status: 400 });
    expect(guard.check({ authorization: auth, message: '   ', now })).toMatchObject({ status: 400 });
    expect(guard.check({ authorization: auth, message: 'hi', document: 42, now })).toMatchObject({ status: 400 });
  });

  it('413 when message + document exceed the cap', () => {
    const guard = createGatewayGuard(config);
    expect(guard.check({ authorization: auth, message: 'a'.repeat(60), document: 'b'.repeat(41), now })).toMatchObject({
      status: 413, error: 'INPUT_TOO_LARGE',
    });
  });
});
