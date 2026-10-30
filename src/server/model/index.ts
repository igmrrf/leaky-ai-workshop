import type { ChatMessage } from '../../lib/types.ts';
import { mockStream } from './mock.ts';
import { ollamaStream } from './ollama.ts';

export type ModelStream = (messages: ChatMessage[]) => AsyncIterable<string>;

export function selectModel(env: NodeJS.ProcessEnv): { name: string; stream: ModelStream } {
  if (env.OLLAMA_URL) {
    const model = env.OLLAMA_MODEL ?? 'llama3.2:3b';
    return { name: `ollama:${model}`, stream: (m) => ollamaStream(env.OLLAMA_URL!, model, m) };
  }
  const delay = Number(env.MOCK_DELAY_MS ?? 25);
  return { name: 'mock', stream: (m) => mockStream(m, delay) };
}
