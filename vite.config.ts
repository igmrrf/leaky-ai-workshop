import { defineConfig, loadEnv } from 'vite';
import { assertNoSecretsInClientEnv } from './exercises/01-key-in-bundle/solution.ts';

export default defineConfig(({ mode }) => {
  // Exercise 01: make the BUILD refuse to inline a secret. Every mode is guarded except
  // `--mode vulnerable`, which exists only so `npm run audit:bundle` can show the leak.
  if (mode !== 'vulnerable') assertNoSecretsInClientEnv(loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']));

  return {
    server: {
      port: 5173,
      strictPort: true,
      // The browser only ever talks to OUR gateway. The gateway holds the provider key.
      proxy: { '/api': 'http://127.0.0.1:8787' },
    },
    build: { sourcemap: false },
  };
});
