# QA Hub

A unified, browser-based toolkit for QA engineers — JSON, regex, encoding, diffs, test data, screenshots, accessibility, and an integrated AI workspace for test cases, bug reports, and Q&A.

Everything runs client-side as a static Next.js app. Bring your own AI API key; AI calls go directly from your browser to the provider. Account sign-in and saved data (AI settings, prompt templates, chat history) are stored in Firebase under your user document.

---

## Features

### AI Assistants (bring your own key)

- **AI Test Case Generator** — turn a feature spec or user story into structured test cases.
- **AI Bug Report Helper** — polish rough notes into a clean, reproducible bug report.
- **AI QA Chat** — conversational assistant tuned to think like a senior QA, with prompt history.

Supports **OpenAI**, **Anthropic Claude**, **Google Gemini**, and **Groq**. Switch providers and models per request. Custom prompt templates are saved per user.

### Data & Formats

- **JSON Tools** — format, validate, minify, convert, and query with JSONPath.
- **Encoding & Hashing** — Base64, URL, HTML entities, JWT decode, MD5/SHA.
- **Regex Playground** — live testing, match highlighting, pattern library.
- **Timestamp Converter** — Unix ↔ ISO ↔ human-readable with timezones.
- **Text Case Converter** — camel, snake, kebab, Pascal, Title, sentence.

### Generators

- **Test Data Generator** — fake names, emails, addresses, credit cards, UUIDs; bulk CSV export.

### Compare & Inspect

- **Diff Viewer** — side-by-side text and JSON diff with inline highlights.
- **Screenshot Annotator** — paste an image, draw arrows / boxes / text, export — fully in-browser.

### API & Web

- **cURL ↔ fetch** — convert cURL commands to JavaScript `fetch` and back.

### Design & Accessibility

- **Color Picker** — convert across HEX, RGB, HSL, HSV, CMYK.
- **A11y Contrast** — WCAG contrast ratio checker for color pairs.
- **Viewport Reference** — common device and screen sizes for responsive testing.

---

## Tech Stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 14 (App Router, static export)              |
| Language     | React 18 + TypeScript 5                             |
| Styling      | Tailwind CSS with custom light/dark theme           |
| Auth & sync  | Firebase Auth (Email/Password + Google), Firestore  |
| AI providers | OpenAI, Anthropic, Gemini, Groq (BYOK, client-side) |
| Tooling      | ESLint, Prettier, Husky, lint-staged                |
| Hosting      | Netlify (static `out/` deploy)                      |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Command             | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the local dev server               |
| `npm run build`     | Static production build (outputs `out/`) |
| `npm run start`     | Serve the production build               |
| `npm run lint`      | ESLint check                             |
| `npm run typecheck` | TypeScript check                         |
| `npm run format`    | Prettier write across `src/`             |

---

## Configuration

### AI providers (in-app, no env vars needed)

Open **Settings → AI**, pick a provider, paste your API key, and choose a default model. Keys are stored in Firestore under your signed-in user document and used directly from the browser to call the provider — QA Hub has no server. Sign-in is therefore required to configure and use the AI tools.

Get an API key:

- OpenAI — <https://platform.openai.com/api-keys>
- Anthropic — <https://console.anthropic.com/settings/keys>
- Google Gemini (free tier available) — <https://aistudio.google.com/app/apikey>
- Groq (free, very fast) — <https://console.groq.com/keys>

### Firebase (required for sign-in and the AI workspace)

Firebase backs authentication and all saved data — AI provider settings, custom prompt templates, and chat history. The standalone utilities (JSON, regex, diff, encoding, screenshot, etc.) work without signing in, but the AI tools require an account. The only thing persisted locally is the theme preference.

1. Create a project at <https://console.firebase.google.com>.
2. **Project settings → General → Your apps**: register a web app, copy the config.
3. **Authentication → Sign-in method**: enable Email/Password and Google. Add your origins (e.g. `http://localhost:3000`) under **Authorized domains**.
4. **Firestore Database**: create a database, then paste the rules from [firestore.rules](firestore.rules).
5. Copy the env template and fill in the values:

```bash
cp .env.local.example .env.local
```

Required keys (all `NEXT_PUBLIC_*` — inlined into the static build; protect data via Firestore rules):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## Usage

1. Launch `npm run dev` and visit the dashboard — every tool is one click from the sidebar or the command palette (`⌘K` / `Ctrl K`).
2. The utility tools (JSON, regex, diff, encoding, screenshot, etc.) work immediately.
3. To use AI tools, **sign in**, then open **Settings → AI**, add a key for any provider, and select a model. Settings, custom prompts, and chats are saved to your Firebase user document and follow you across devices.
4. Switch theme via the header toggle.

---

## System Architecture

QA Hub is a **100% client-side static app** — no backend server, no proxy.

```
┌────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                       │
│                                                                │
│   Next.js App Router (static export, hydrated React 18)        │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │  App Shell  ── Sidebar · Header · Theme · Cmd Palette    │ │
│   └──────────────────────────────────────────────────────────┘ │
│   ┌────────────────────────┐  ┌─────────────────────────────┐  │
│   │  Tool Pages (15)       │  │  AI Workspace               │  │
│   │  JSON, Regex, Diff,    │  │  Test Cases · Bug Report    │  │
│   │  Encoding, Screenshot… │  │  Chat · Prompt Library      │  │
│   └────────────────────────┘  └──────────────┬──────────────┘  │
│                                              │                 │
│   ┌──────────────────────────────────────────┴───────────────┐ │
│   │  lib/  — utils · tool registry · AI client · auth ctx    │ │
│   └──────────────────────────┬───────────────────────────────┘ │
│                              │                                 │
│                     ┌────────┴─────────┐                       │
│                     │  Firebase Web SDK│                       │
│                     └────────┬─────────┘                       │
└──────────────────────────────┼─────────────────────────────────┘
                               │
              ┌────────────────┴────────────────────┐
              │  Firebase Auth  ·  Firestore        │
              │  users/{uid}/settings/ai            │
              │  users/{uid}/prompts/{key}          │
              │  users/{uid}/chats/{id}/messages/*  │
              └─────────────────────────────────────┘

                ┌─────────────────────────────────────────────┐
   AI calls →   │  OpenAI · Anthropic · Gemini · Groq APIs    │
                │  (direct from browser, BYOK)                │
                └─────────────────────────────────────────────┘
```

### Key principles

- **No server**. Static `out/` is deployable to any CDN (Netlify, Vercel static, S3, GitHub Pages).
- **BYOK**. API keys are stored per-user in Firestore and used directly from the browser to call provider APIs — no QA Hub intermediary.
- **Firestore as source of truth**. AI settings, prompts, and chats live under `users/{uid}/…`. Only the theme is cached locally.
- **Per-user isolation**. Firestore rules restrict every document to its owning UID.
- **Progressive**. Standalone utilities (JSON, regex, diff, encoding, screenshot, etc.) work without an account; AI tools require sign-in.

### Project layout

| Layer      | Path                                                   | Purpose                                               |
| ---------- | ------------------------------------------------------ | ----------------------------------------------------- |
| **App**    | `src/app/`                                             | Routes, layouts, and pages (App Router)               |
|            | `src/app/page.tsx`                                     | Dashboard                                             |
|            | `src/app/login/`                                       | Sign-in                                               |
|            | `src/app/settings/ai/`                                 | AI provider settings                                  |
|            | `src/app/tools/<slug>/`                                | One route per tool (15 tools)                         |
| **UI**     | `src/components/layout/`                               | App shell, sidebar, header, theme, error boundary     |
|            | `src/components/ai/`                                   | Shared AI UI (model picker, prompts, markdown)        |
|            | `src/components/ai-chat/`                              | Chat workspace                                        |
|            | `src/components/ai-settings/`                          | Provider cards, vault, passphrase                     |
|            | `src/components/json/` · `screenshot/` · `ui/`         | Tool-specific and shared primitives                   |
|            | `src/components/ToolPage.tsx`                          | Standard tool page chrome                             |
| **Core**   | `src/lib/tools.ts`                                     | Tool registry (titles, icons, categories, routes)     |
|            | `src/lib/firebase.ts`                                  | Lazy Firebase initializer                             |
|            | `src/lib/auth/`                                        | Auth context and hooks                                |
|            | `src/lib/ai/`                                          | Providers, settings, prompts, chat, streaming, crypto |
|            | `src/lib/screenshot/`                                  | Annotator canvas logic                                |
|            | `src/lib/utils.ts` · `prism.ts` · `highlightTerms.tsx` | Shared helpers                                        |
| **Config** | `firestore.rules`                                      | Per-user Firestore isolation                          |
|            | `.env.local.example`                                   | Firebase env template                                 |
|            | `netlify.toml`                                         | Static build, publish `out/`, security headers        |

<details>
<summary>Directory tree</summary>

```text
qa-hub/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard
│   │   ├── login/                   # Sign-in
│   │   ├── settings/ai/             # AI provider settings
│   │   └── tools/<slug>/page.tsx    # One folder per tool
│   ├── components/
│   │   ├── layout/                  # AppShell, Sidebar, Header, Theme
│   │   ├── ai/ · ai-chat/ · ai-settings/
│   │   ├── json/ · screenshot/ · ui/
│   │   └── ToolPage.tsx
│   └── lib/
│       ├── tools.ts
│       ├── firebase.ts
│       ├── auth/AuthContext.tsx
│       ├── ai/                      # providers, settings, chat, client
│       ├── screenshot/
│       └── utils.ts · prism.ts · highlightTerms.tsx
├── firestore.rules
├── .env.local.example
└── netlify.toml
```

</details>

---

## Deployment

### Netlify (recommended)

1. Push the repo to GitHub.
2. In Netlify, **Add new site → Import an existing project** and select the repo. Build settings are auto-detected from [netlify.toml](netlify.toml) (`npm run build` → publish `out/`).
3. Add the `NEXT_PUBLIC_FIREBASE_*` env vars under **Site settings → Environment variables**.
4. Trigger a deploy.

Or build locally and drag-and-drop the `out/` folder into Netlify.

### Any static host

```bash
npm run build
# upload the resulting out/ directory to your CDN of choice
```

---

## Security & Privacy

- **API keys**: stored in Firestore under your user document and read into the browser at runtime to call providers directly. Never proxied through a QA Hub server.
- **AI prompts and chats**: sent directly from your browser to the chosen provider, and the conversation is persisted under `users/{uid}/chats/…`. Subject to that provider's data policy.
- **Firestore rules**: restrict reads and writes to the document owner. See [firestore.rules](firestore.rules).
- **Local storage**: only the theme preference is kept in `localStorage`.
- **No analytics or trackers** in the shipped app.

---

## Roadmap

- Team workspaces with shared prompt libraries
- More AI providers (Mistral, local Ollama)
- Saved tool sessions (JSON snippets, regex patterns) synced via Firestore
- Browser extension for capture-to-screenshot-annotator
- CLI for offline test-data generation

---

## Contributing

Issues and pull requests are welcome. Before opening a PR, please run:

```bash
npm run lint
npm run typecheck
npm run format
```

A Husky pre-commit hook runs `lint-staged` automatically on staged files.
