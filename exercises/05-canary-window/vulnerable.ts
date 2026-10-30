// ❌ Slide 16: "The canary check that never fires"
// Looks right. Catches nothing in production, because production STREAMS:
//   "CAN" "ARY" "-3f" "a2" "-9c" ...   no single chunk ever contains the whole token.
export function createCanaryMonitor(canaryToken: string) {
  return {
    inspect(chunk: string): boolean {
      return chunk.includes(canaryToken);
    },
  };
}
