// ❌ Exercise 01. Referencing import.meta.env.VITE_* is an instruction to Vite:
// "paste this value into the JavaScript bundle". `npm run audit:bundle` builds with
// `--mode vulnerable` (which loads .env.vulnerable, a FAKE key) and greps dist-vulnerable/.
// The normal build is guarded by vite.config.ts and contains no key.
// nosemgrep: client-env-secret -- intentional: this IS exercise 01's bug, built only with --mode vulnerable
export const DIRECT_PROVIDER_KEY: string = import.meta.env.VITE_OPENAI_API_KEY ?? '';
