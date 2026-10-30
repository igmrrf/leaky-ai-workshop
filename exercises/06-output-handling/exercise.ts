// EXERCISE 06 · Output handling (LLM05)           slide 21: "Where each control lands" (LLM05 card)
// Run: npm run test:06        Reference: ./solution.ts
//
// The UI renders model output with el.innerHTML = toHtml(text). Treat the model as an
// untrusted user who happens to be very articulate.
//
// TODO:
//   1. HTML-escape EVERYTHING first:  & < > " '  ->  &amp; &lt; &gt; &quot; &#39;
//   2. THEN re-enable a tiny, safe subset of markdown on the escaped text:
//        **bold**            -> <strong>bold</strong>
//        [label](https://x)  -> <a href="https://x" rel="noopener noreferrer" target="_blank">label</a>
//      Only http:// and https:// links. A javascript: or data: link stays as plain text.
//      newline              -> <br>
// (In a real app: a vetted sanitiser like DOMPurify, or render to text nodes. The idea is the same.)
export function toHtml(modelText: string): string {
  void modelText;
  throw new Error('TODO(06): escape model output before it reaches the DOM');
}
