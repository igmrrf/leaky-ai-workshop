# Facilitator guide (30-minute session)

The slides and this repo run side by side: slides on the left, terminal and browser on the right.
Every secret here is FAKE. Say so once at the start, then don't spend more time on it.

## Before you walk on stage

- [ ] `npm install` done on **your** machine, offline-tested (turn the wifi off once and run `npm test`).
- [ ] `npm run demo` running, `http://localhost:5173` open, toggle on **Vulnerable**, transcript cleared.
- [ ] A second terminal in the repo root, font size large, ready for `npm run test:03`.
- [ ] Three files open in the editor, in tabs: `exercises/03-step-up-ticket/exercise.ts`,
      `exercises/05-canary-window/exercise.ts`, `exercises/08-secret-scanner/exercise.ts`.
- [ ] Repo URL / QR on the slide, so attendees can clone it during setup.
- [ ] Fallback: if the UI breaks, run the curl block from README.md. Don't debug live.

## Run of show (30 min)

The deck's speaker notes are the source of truth: every slide's note starts with a
`[m:ss → m:ss]` cue, and this table mirrors them. If the two ever disagree, follow the deck.

| Time | Slides | Block | What happens | Command / file |
|---|---|---|---|---|
| 0:00–2:00 | 1–4 | **Intro** | Cover, speaker, learning objectives, agenda. | — |
| 2:00–3:00 | 5 | **Setup** (60 s) | Leave the clone slide up while attendees clone and run `npm install`. Anyone who isn't ready pairs with a neighbour. | `npm install && npm run demo` |
| 3:00–4:45 | 6–7 | **The core idea** | The one-line bundle audit, then "instructions and data share one channel". | `npm run audit:bundle` (optional) |
| 4:45–6:45 | 8 | **Live demo** (2 min) | Vulnerable → prompt injection leaks. Hardened → canary cuts the stream mid-word. Hardened → $5,000 transfer → step-up modal → **Approve with passkey** → audit trail. Then the same button in Vulnerable: the modal still opens, but the browser makes up an `MFA_PROOF_` ticket and the server accepts it. Full runbook: README "The live demo". | `npm run demo` |
| 6:45–9:45 | 9–12 | **Access & agency** | Gateway, step-up binding, then the `startsWith('MFA_PROOF_')` confession slide. | — |
| 9:45–12:45 | 13 | **Exercise 03** step-up ticket (3 min) | Timer on, walk the room. Land on the `ARGUMENTS_TAMPERED` test. At 2:30, point stragglers at the solution run. | `npm run test:03` · `exercises/03-step-up-ticket/exercise.ts` |
| 12:45–15:15 | 14–16 | **Prompt & stream** | Direct vs indirect injection, then the per-chunk canary bug. | — |
| 15:15–18:15 | 17 | **Exercise 05** canary window (3 min) | The vulnerable check never fires on a split token. Write the rolling window and watch it go green. | `npm run test:05` · `exercises/05-canary-window/exercise.ts` |
| 18:15–19:00 | 18 | **Scanner confession** (45 s) | The buggy regex said "clean" with a key in the tree. | `npm run scan:secrets` |
| 19:00–21:30 | 19 | **Exercise 08** planted secret (2 min 30 s) | Fix the character class and run the test. | `npm run test:08` · `exercises/08-secret-scanner/exercise.ts` |
| 21:30–25:45 | 20–23 | **Contain, map, sovereignty, checklist** | Hardened container + CI gates, OWASP LLM Top 10 map, hybrid routing, the "Monday morning" list. Take-home: exercises 01, 02, 04, 06, 07, plus `infra/` and the CI workflow. | README exercise table |
| 25:45–30:00 | 24 | **Q&A** (~4 min) | Leave the thank-you slide (QR codes) up for the whole Q&A. | — |

### Live-coding shortcuts (if time is short)

You don't have to type every line. Each `solution.ts` is short enough to paste and then explain:

```bash
cp exercises/05-canary-window/exercise.ts /tmp/05-stub.ts                     # keep the stub
cp exercises/05-canary-window/solution.ts exercises/05-canary-window/exercise.ts && npm run test:05
cp /tmp/05-stub.ts exercises/05-canary-window/exercise.ts                     # reset for the next run
```

You can also show the reference against the same tests without touching the stub:
`npm run test:05 -- --mode solution`.

### Catch-up branches (say this when the timer ends)

Each live exercise has a checkpoint branch with that exercise (and every earlier one) solved.
`-f` discards local edits, so tell people to `git stash` first if they want to keep theirs.

- **03:** `git switch -f step-03 && npm run test:03`
- **05:** `git switch -f step-05 && npm run test:05`
- **08:** `git switch -f step-08 && npm run test:08`

### Lines that matter

- **03:** "Approve $5, replay for $50,000. Bind the ticket to the user and the action, and hash the arguments."
- **05:** "It typechecks, it reads correctly, it passes a test that feeds it the whole string, and
  in production it never fires, because production streams."
- **08:** "A control you never tested against a known-bad input isn't a control. It's a comfort blanket."
- **Canary honesty:** "Deploy it. Alert on it. Never report it as coverage."

## If the room is ahead or behind

- **Ahead:** do exercise 06 live. Click "4 · Output handling" in Vulnerable mode first. The red XSS
  bar is a strong visual.
- **Behind:** skip exercise 08 live and show `npm run scan:secrets` only (30 s).
- **No wifi at all:** everything still works. If someone can't install, they can follow along
  on a neighbour's screen.

## Extended format (60–90 min), for a later run

Setup 5 · demo 10 · exercises 01–08 at ~6 min each (≈50) · infra walkthrough
(`docker compose -f infra/compose.yaml up --build`, then try `touch /x` inside the container) 10 ·
Q&A 10.
