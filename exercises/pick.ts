// Decides whether the tests exercise YOUR code (exercise.ts) or the reference (solution.ts).
//   npm run test:03                  -> exercise.ts  (red until you finish the TODOs)
//   npm test  /  SOLUTION=1 vitest   -> solution.ts  (always green)
export const USE_SOLUTION = import.meta.env.MODE === 'solution' || process.env.SOLUTION === '1';
export const target = USE_SOLUTION ? 'solution.ts' : 'exercise.ts';
export const pick = <T>(exercise: T, solution: T): T => (USE_SOLUTION ? solution : exercise);
