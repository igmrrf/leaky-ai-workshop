/** surrogate -> real value, e.g. "[EMAIL_1]" -> "ada@example.com". It never leaves your infrastructure. */
export type Vault = Map<string, string>;

/** Anything outside your infrastructure: a frontier cloud model, a log pipeline, a vendor. */
export type CloudModel = (prompt: string) => Promise<string>;

export interface Tokenised {
  text: string; // safe to send across the border
  vault: Vault; // stays home
}
