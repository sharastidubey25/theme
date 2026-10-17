# FixPapa Assistant

Floating technician avatar + chat panel, loaded on every page (vanilla JS, no build step).

> **Demo mode.** By default the assistant uses `mock-service.js`: keyword-matched, canned answers taken from the website copy. It is **not** an AI and makes no network calls. The panel shows "Demo mode · sample answers, not a live AI" while the mock is active.

## Files

| File | Responsibility | Knows about |
|---|---|---|
| `service.js` | Chat service contract, `ServiceError`, `normalizeResponse()`, **real backend adapter** (`createHttpService`) | nothing else |
| `mock-service.js` | **Mock** service with sample replies (demo only) | the contract |
| `conversation.js` | Message list, send/retry/reset, timeout, duplicate-send guard, `sessionStorage` persistence | a service object |
| `chat-ui.js` | Panel DOM, rendering, input, open/minimize/close, accessibility | a conversation object |
| `avatar.js` | Technician SVG + `setState()` | nothing else |
| `assistant.js` | Config, launcher + tooltip, **chat events → avatar states** | all of the above |
| `../../css/assistant.css` | Widget styles and every avatar expression/animation | — |

Load order on each page: `service → mock-service → conversation → avatar → chat-ui → assistant`. Everything hangs off one global namespace, `window.FPAssistant`.

## Avatar states

A standing technician with an East Asian skin tone, a blue baseball cap, a white shirt with the FixPapa logo from `assets/img/logo.png` on the chest, blue formal trousers and black formal shoes. At rest he stands with his arms crossed. The launcher shows the full figure; the panel header shows a head-and-chest crop (`createAvatar(el, { view: 'bust' })`). Change the logo path with `FPAssistantConfig.logoSrc`.

`idle` (arms crossed, breathing, blinking) · `greeting` (waves, grin) · `listening` (leans in, head tilt) · `thinking` (hand on chin, thought bubble) · `talking` (moving mouth, open-hand gesture) · `happy` (^ ^ eyes, waves, jumps, sparkles) · `error` (worried brows, frown, sweat drop, shake).

`avatar.js` only sets `data-state` on the SVG; the CSS does the rest. `assistant.js` decides when:

| Event | Avatar |
|---|---|
| panel opens / tooltip appears | `greeting` for 1.8 s → `idle` |
| user is typing a draft | `listening` |
| request sent (`conversation` → `request`) | `thinking` |
| answer is being shown (`ui` → `reply:start`) | `talking` |
| answer finished (`reply:done`) | `happy` for 1.7 s if `mood: "happy"`, else `idle` |
| request failed (`conversation` → `error`) | `error` for 2.6 s → `idle` |

**Replacing the avatar** (Lottie, Rive, a video sprite…): write an object with `setState(name)`, `getState()` and `destroy()`, and return it from `FPAssistant.createAvatar(container)`. Nothing in the chat code changes. Remove `avatar.js` entirely and the chat still works (the header slot stays empty).

## Turning on a real backend

1. Implement the endpoint below on FixPapa's server. The server holds any AI-provider keys; the browser never sees them.
2. Before the assistant scripts, add:
   ```html
   <script>window.FPAssistantConfig = { service: 'http', endpoint: '/api/assistant/chat', timeoutMs: 15000 };</script>
   ```
   (`enabled: false` hides the widget; `headers: {…}` adds request headers, e.g. a CSRF token.)
3. Optionally delete `mock-service.js` from the pages.

### API contract

`POST {endpoint}` · `Content-Type: application/json` · cookies sent (`credentials: 'same-origin'`)

Request:
```json
{
  "sessionId": "5f0c…",
  "message": { "text": "How much will my laptop repair cost?" },
  "history": [ { "role": "user", "text": "Hi" }, { "role": "assistant", "text": "Hello! …" } ],
  "context": { "page": "/repair.html", "title": "Book a Repair | FixPapa" }
}
```
`history` holds up to the last 12 messages before this one. Messages are capped at 500 characters.

Response `200`:
```json
{
  "reply": {
    "text": "Plain text. Use \n for new lines.",
    "suggestions": ["Book a repair", "Talk to a person"],
    "actions": [ { "label": "Book a repair", "href": "repair.html#book-now" } ],
    "mood": "happy"
  },
  "meta": { "source": "ai" }
}
```
- `text` is required and shown as plain text (HTML is escaped). Max 4000 characters.
- `suggestions` (≤ 4) become quick-reply chips; `actions` (≤ 3) become link buttons. Allowed links: site paths/anchors, `https://`, `tel:`, `mailto:`.
- `mood`: `"happy"` after a successful step (booking made, etc.), otherwise omit or `"neutral"`.
- `"reply": "just a string"` is also accepted.

Errors: any non-2xx status shows a friendly error with **Try again** (except 4xx other than 429, which shows no retry button). Timeouts, network failures, non-JSON bodies, a missing `reply` or empty text are all handled the same way.

## Testing the demo

Serve the folder (`python3 -m http.server 8000`) and open any page. Click the technician at the bottom-right.

Type these in the chat to see the failure states (mock only):
`/error` (service failure) · `/timeout` (no answer → timeout) · `/empty` (empty reply) · `/garbage` (malformed reply).
