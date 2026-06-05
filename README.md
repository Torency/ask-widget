# @torency/ask-widget

Embeddable React Ask widget for an Archeo / `memory` backend.

## Install

```bash
npm install @torency/ask-widget
```

## Use

```tsx
import { AskWidget } from "@torency/ask-widget";
import "@torency/ask-widget/styles.css";

export function CasciiAsk() {
  return (
    <AskWidget
      backendUrl="https://chat.hjoncour.com"
      sourceId="project:cascii"
      labels={{
        title: "Ask about Cascii",
        inputPlaceholder: "Ask how Cascii works"
      }}
    />
  );
}
```

## Props

- `backendUrl`: origin that exposes `/app-config` and `/ask`.
- `sourceId`, `repoId`, `targetId`: optional backend retrieval target.
- `topK`: optional retrieval size.
- `turnstileSiteKey`: optional explicit Cloudflare Turnstile site key. If omitted, the widget fetches `/app-config`.
- `turnstileAction`: defaults to the action from `/app-config`, then `ask`.
- `adminToken`: optional admin bypass for private/internal usage.
- `showCitations`: default `false`.
- `showStaleWarnings`: default `true`.
- `labels`: title, placeholder, empty state, send label, Turnstile label.
- `onResult`: callback after a successful response.
- `onError`: callback after a failed response.

## Backend Requirements

The backend or auth worker must allow the embedding site origin in CORS. For `cascii.com`, add that origin to the worker/backend allowlist.

If public users are protected by Turnstile, the Turnstile site key must allow the embedding domain, for example `cascii.com`.

The widget sends:

```http
POST /ask
Content-Type: application/json
X-Transaction-Id: <uuid>
```

with a body like:

```json
{
  "question": "What is Cascii?",
  "sourceId": "project:cascii",
  "turnstileToken": "..."
}
```

and expects the current `memory` response shape:

```json
{
  "result": {
    "answer": "...",
    "citations": [],
    "hits": [],
    "mode": "llm",
    "question": "...",
    "repoId": "project:cascii",
    "staleRepos": []
  }
}
```
