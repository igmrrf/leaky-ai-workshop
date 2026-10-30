import { callTool, ensureSession, fetchAudit, requestServerTicket, streamChat, type Mode, type ToolCall } from './api.ts';
import { CV_DOCUMENT, INJECTION, REPORT_DOCUMENT, TRANSFER } from './demos.ts';
import { DIRECT_PROVIDER_KEY } from './leaky-config.ts';
// Exercise 06: the vulnerable renderer returns raw model text; the fixed one escapes it.
import * as renderVuln from '../../exercises/06-output-handling/vulnerable.ts';
import * as renderFixed from '../../exercises/06-output-handling/solution.ts';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const transcript = $('#transcript');
const banner = $('#banner');
let mode: Mode = (localStorage.getItem('leaky.mode') as Mode | null) ?? 'vulnerable';

// ------------------------------------------------------------------ mode toggle
function setMode(next: Mode) {
  mode = next;
  localStorage.setItem('leaky.mode', mode);
  document.body.dataset.mode = mode;
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
    b.setAttribute('aria-checked', String(b.dataset.mode === mode));
  }
  hideBanner();
}
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
  b.addEventListener('click', () => setMode(b.dataset.mode as Mode));
}

// ------------------------------------------------------------------ transcript helpers
function bubble(kind: 'user' | 'assistant' | 'system', text = ''): HTMLDivElement {
  const el = document.createElement('div');
  el.className = `msg ${kind}`;
  el.dataset.mode = mode;
  el.textContent = text; // OUR text: always textContent
  transcript.append(el);
  transcript.scrollTop = transcript.scrollHeight;
  return el;
}
function showBanner(kind: 'danger' | 'ok', title: string, text: string) {
  const strong = document.createElement('strong');
  strong.textContent = title;
  banner.className = `banner ${kind}`;
  banner.replaceChildren(strong, ` ${text}`);
  banner.hidden = false;
}
function hideBanner() {
  banner.hidden = true;
}

// ------------------------------------------------------------------ chat
async function send(message: string, document?: string, attachmentLabel?: string) {
  const u = bubble('user', message);
  if (attachmentLabel) {
    const a = window.document.createElement('div');
    a.className = 'attachment';
    a.textContent = attachmentLabel;
    u.append(a);
  }
  const out = bubble('assistant');
  let text = '';
  let toolCall: ToolCall | undefined;
  try {
    for await (const ev of streamChat(mode, message, document)) {
      if (ev.type === 'chunk') {
        text += ev.text;
        // Exercise 06 (LLM05). Vulnerable: model output straight into innerHTML.
        // nosemgrep: model-output-into-innerhtml -- the demo toggle; hardened uses the escaping renderer
        out.innerHTML = (mode === 'vulnerable' ? renderVuln : renderFixed).toHtml(text);
        transcript.scrollTop = transcript.scrollHeight;
      } else if (ev.type === 'killed') {
        const cut = window.document.createElement('span');
        cut.className = 'killed';
        cut.textContent = ' ✂ STREAM KILLED: canary tripped';
        out.append(cut);
        showBanner('ok', 'Canary killswitch.', 'The system prompt started to leak; the gateway cut the stream mid-word, before any secret.');
      } else if (ev.type === 'tool') {
        toolCall = ev.call;
      }
    }
    if (mode === 'vulnerable' && /DB_PASSWORD|sk-prod-/.test(text)) {
      showBanner('danger', 'Leaked.', 'System prompt, FAKE database password and FAKE API key streamed to the browser. The per-chunk canary check never fired.');
    }
  } catch (err) {
    out.classList.add('error');
    out.textContent = `Gateway refused: ${(err as Error).message}`;
  }
  void refreshAudit();
  if (toolCall) await runTool(toolCall);
}

// ------------------------------------------------------------------ privileged tools
const dialog = $<HTMLDialogElement>('#stepup');
function approve(call: ToolCall): Promise<boolean> {
  const details = $('#stepup-details');
  details.replaceChildren();
  for (const [k, v] of Object.entries<unknown>({ action: call.name, ...call.args })) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = typeof v === 'number' ? v.toLocaleString('en-US') : String(v);
    details.append(dt, dd);
  }
  $('#stepup-mode').textContent =
    mode === 'hardened'
      ? 'Hardened: the server will sign a ticket bound to you + this action + sha256(these args), valid 60s, once.'
      : 'Vulnerable: the browser will make up its own ticket: "MFA_PROOF_" + Date.now().';
  dialog.showModal();
  return new Promise((resolve) => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'approve'), { once: true }));
}

async function runTool(call: ToolCall) {
  const first = await callTool(mode, call);
  if (first.status !== 403) return report(first);
  bubble('system', `403 ${String(first.body.error)}: ${call.name} needs step-up approval.`);
  if (!(await approve(call))) {
    bubble('system', 'Denied. Nothing was executed.');
    return void refreshAudit();
  }
  // The difference that matters: who constructs the ticket.
  const ticket = mode === 'hardened' ? await requestServerTicket(call) : `MFA_PROOF_${Date.now()}`;
  bubble('system', `x-mfa-ticket: ${ticket.length > 48 ? `${ticket.slice(0, 48)}…` : ticket}`);
  report(await callTool(mode, call, ticket));
}

function report(r: { status: number; body: Record<string, unknown> }) {
  const el = bubble('system', `${r.status} ${JSON.stringify(r.body)}`);
  el.classList.add(r.status === 200 ? 'executed' : 'error');
  void refreshAudit();
}

// ------------------------------------------------------------------ audit panel
const auditList = $('#audit');
async function refreshAudit() {
  try {
    const entries = await fetchAudit();
    auditList.replaceChildren(
      ...entries.map((e) => {
        const li = document.createElement('li');
        li.className = `ev ev-${e.event.toLowerCase()} m-${e.mode}`;
        li.textContent = `${e.ts.slice(11, 19)}  ${e.mode === 'vulnerable' ? 'VULN' : 'HARD'}  ${e.userId}  ${e.event}${e.detail ? `  ${e.detail}` : ''}`;
        return li;
      }),
    );
  } catch {
    /* gateway restarting: try again on the next tick */
  }
}

// ------------------------------------------------------------------ wiring
const demos: Record<string, () => unknown> = {
  injection: () => send(INJECTION),
  indirect: () => send('Summarise this CV for the hiring panel.', CV_DOCUMENT, '📎 jane-doe-cv.pdf (contains white-on-white text)'),
  transfer: () => send(TRANSFER),
  xss: () => send('Summarise the attached quarterly report.', REPORT_DOCUMENT, '📎 q3-report.docx'),
  clear: () => {
    transcript.replaceChildren();
    hideBanner();
    document.body.classList.remove('pwned');
  },
};
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-demo]')) {
  b.addEventListener('click', () => void demos[b.dataset.demo!]?.());
}
$<HTMLFormElement>('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $<HTMLInputElement>('#input');
  if (input.value.trim()) void send(input.value);
  input.value = '';
});

$('#bundle-key').textContent = DIRECT_PROVIDER_KEY
  ? `Exercise 01: this bundle contains a provider key (${DIRECT_PROVIDER_KEY.slice(0, 8)}…). Anyone can read it.`
  : 'Exercise 01: no provider key in this bundle. The gateway holds it.';

setMode(mode);
await ensureSession();
void refreshAudit();
setInterval(() => void refreshAudit(), 3000);
