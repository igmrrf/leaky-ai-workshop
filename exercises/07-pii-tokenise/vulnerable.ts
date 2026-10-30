// ❌ Slide 22: "Keep identifiers home. Rent only the reasoning."
// Raw PII goes straight to a third-party model: their logs, their retention, their jurisdiction.
import type { CloudModel } from './types.ts';

export async function hybridAnswer(userText: string, cloud: CloudModel): Promise<string> {
  return cloud(userText);
}
