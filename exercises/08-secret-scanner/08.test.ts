import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pick, target } from '../pick.ts';
import * as exercise from './exercise.ts';
import * as solution from './solution.ts';
import * as vulnerable from './vulnerable.ts';

const { scanForSecrets } = pick(exercise, solution);
const read = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const PLANTED = 'sk-prod-FAKE99214810294';

describe(`08 secret scanner vs a planted secret [${target}]`, () => {
  it('the vulnerable scanner reports a clean tree while the secret sits right there (the bug)', () => {
    const src = read('planted-secret.ts');
    expect(src).toContain(PLANTED);
    expect(vulnerable.scanForSecrets(src)).toEqual([]);
  });

  it('finds the planted secret', () => {
    expect(scanForSecrets(read('planted-secret.ts'))).toEqual([PLANTED]);
  });

  it('finds common real-world shapes', () => {
    for (const k of ['sk-proj-FAKE-4f2a9c81d77e0b3a', 'sk-live_FAKE0000000000000000', 'sk-FAKEabcdefghijklmnop']) {
      expect(scanForSecrets(`const k = "${k}";`)).toEqual([k]);
    }
  });

  it('stays quiet on clean files', () => {
    expect(scanForSecrets(read('clean.ts'))).toEqual([]);
  });

  it('finds every secret, not just the first', () => {
    expect(scanForSecrets('a=sk-proj-FAKE-0000000000000000 b=sk-prod-FAKE99214810294')).toHaveLength(2);
  });
});
