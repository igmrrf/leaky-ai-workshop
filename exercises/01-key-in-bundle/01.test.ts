import { describe, expect, it } from 'vitest';
import { pick, target } from '../pick.ts';
import * as exercise from './exercise.ts';
import * as solution from './solution.ts';
import * as vulnerable from './vulnerable.ts';

const { assertNoSecretsInClientEnv } = pick(exercise, solution);

describe(`01 key in bundle [${target}]`, () => {
  it('the vulnerable guard lets a provider key into the bundle (the bug)', () => {
    expect(() => vulnerable.assertNoSecretsInClientEnv({ VITE_OPENAI_API_KEY: 'sk-proj-FAKE-0000000000000000' })).not.toThrow();
  });

  it('rejects a VITE_ variable with a secret-sounding name', () => {
    expect(() => assertNoSecretsInClientEnv({ VITE_OPENAI_API_KEY: 'whatever' })).toThrow(/VITE_OPENAI_API_KEY/);
  });

  it('rejects NEXT_PUBLIC_ too', () => {
    expect(() => assertNoSecretsInClientEnv({ NEXT_PUBLIC_AI_TOKEN: 'x' })).toThrow(/NEXT_PUBLIC_AI_TOKEN/);
  });

  it('rejects a provider-key-shaped VALUE even under an innocent name', () => {
    expect(() => assertNoSecretsInClientEnv({ VITE_CONFIG: 'sk-prod-FAKE99214810294' })).toThrow(/VITE_CONFIG/);
  });

  it('never prints the secret value in the error', () => {
    try {
      assertNoSecretsInClientEnv({ VITE_CONFIG: 'sk-prod-FAKE99214810294' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(String(err)).not.toContain('sk-prod-FAKE99214810294');
    }
  });

  it('allows harmless public config and ignores server-only secrets', () => {
    expect(() =>
      assertNoSecretsInClientEnv({
        VITE_APP_NAME: 'Leaky Bank',
        VITE_API_BASE: '/api',
        OPENAI_API_KEY: 'sk-proj-FAKE-0000000000000000', // no public prefix: stays on the server
      }),
    ).not.toThrow();
  });
});
