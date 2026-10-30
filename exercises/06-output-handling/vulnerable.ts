// ❌ Slide: "The one people forget": LLM05 Improper Output Handling.
// The model's answer goes straight into element.innerHTML. If a poisoned document convinces
// the model to echo <img src=x onerror=...>, that JavaScript runs in YOUR origin, with YOUR
// user's session. XSS with extra steps.
export function toHtml(modelText: string): string {
  return modelText; // caller does: el.innerHTML = toHtml(text)
}
