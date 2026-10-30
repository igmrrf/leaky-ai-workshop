// ✅ EXERCISE 06 solution. Escape first, then allow a tiny known-safe subset back in.
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);

export function toHtml(modelText: string): string {
  return escapeHtml(modelText) // 1. nothing the model says can become markup...
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>') // 2. ...except what we add back on purpose
    .replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^\s)"<>]+)\)/g, // allow-list the scheme: no javascript:, no data:
      '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>',
    )
    .replace(/\n/g, '<br>');
}
