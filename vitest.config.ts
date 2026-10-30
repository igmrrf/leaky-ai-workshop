import { defineConfig } from 'vitest/config';

// `npm test`            -> vitest run --mode solution  (tests import solution.ts, all green)
// `npm run test:NN`     -> vitest run exercises/NN-*   (tests import exercise.ts, red until you fix it)
export default defineConfig({
  test: {
    include: ['exercises/**/*.test.ts', 'src/**/*.test.ts'],
    env: { MOCK_DELAY_MS: '0' },
  },
});
