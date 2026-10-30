// Optional: a REAL local model via Ollama (set OLLAMA_URL). Same streaming interface as the mock.
// This is the "sovereign inference" tier from the talk: the prompt never leaves your machine.
import type { ChatMessage } from '../../lib/types.ts';

export async function* ollamaStream(url: string, model: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(`${url.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama returned ${res.status}`);

  // Ollama streams NDJSON: one {"message":{"content":"..."}} object per line.
  const decoder = new TextDecoder();
  let buffered = '';
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    const lines = buffered.split('\n');
    buffered = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const text = (JSON.parse(line) as { message?: { content?: string } }).message?.content;
      if (text) yield text;
    }
  }
}
