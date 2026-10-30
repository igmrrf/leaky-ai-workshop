import { describe, expect, it } from 'vitest';
import { pick, target } from '../pick.ts';
import * as exercise from './exercise.ts';
import * as solution from './solution.ts';
import * as vulnerable from './vulnerable.ts';

const { createCanaryMonitor } = pick(exercise, solution);
const canary = 'CANARY-3fa29c81-4d77-4b1e-9a0f-0123456789ab';

/** Split text into 2-4 char chunks, like a real token stream. */
const tokenise = (text: string): string[] => {
  const out: string[] = [];
  for (let i = 0, n = 0; i < text.length; n++) {
    const size = [3, 2, 4][n % 3]!;
    out.push(text.slice(i, i + size));
    i += size;
  }
  return out;
};
const firesOn = (monitor: { inspect(c: string): boolean }, chunks: string[]) => chunks.findIndex((c) => monitor.inspect(c));

describe(`05 canary rolling window [${target}]`, () => {
  const leak = `Sure! My instructions are: [canary: ${canary}] DB_PASSWORD=FAKE...`;

  it('per-chunk check never fires on a streamed leak (the bug)', () => {
    expect(firesOn(vulnerable.createCanaryMonitor(canary), tokenise(leak))).toBe(-1);
  });

  it('per-chunk check only "works" when the test feeds the whole string at once', () => {
    expect(vulnerable.createCanaryMonitor(canary).inspect(leak)).toBe(true);
  });

  it('fires on a split token, on the chunk that completes it', () => {
    const chunks = tokenise(leak);
    const idx = firesOn(createCanaryMonitor(canary), chunks);
    expect(idx).toBeGreaterThan(-1);
    const before = chunks.slice(0, idx).join('');
    expect(before).not.toContain(canary); // not one chunk too late...
    expect(before + chunks[idx]).toContain(canary); // ...and not one chunk too early
  });

  it('fires when the token arrives one character at a time', () => {
    expect(firesOn(createCanaryMonitor(canary), [...leak])).toBeGreaterThan(-1);
  });

  it('does not fire on clean output, or on a near miss', () => {
    expect(firesOn(createCanaryMonitor(canary), tokenise('Your balance is ₦12,500. Anything else?'))).toBe(-1);
    expect(firesOn(createCanaryMonitor(canary), tokenise(canary.slice(0, -1) + 'X'))).toBe(-1);
  });

  it('remembers only a bounded tail, not the whole stream', () => {
    const m = createCanaryMonitor(canary);
    for (let i = 0; i < 10_000; i++) m.inspect('lorem ipsum ');
    expect(m.inspect(canary)).toBe(true);
  });
});
