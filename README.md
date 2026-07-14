# GitEase

GitEase is a visual, collaborative Git workspace built on top of GitHub. It doesn't replace Git or GitHub — GitHub stays the source of truth for repos, branches, commits, and permissions — but it simplifies the common day-to-day workflow: browsing repos, managing branches, and running git commands (status, add, commit, push, pull, fetch, branch create/switch/delete) from a web dashboard instead of the terminal.

It's built for students and developers who know roughly what they want to do in git but don't want to memorize the CLI for it.

## How it works

```
Browser (Next.js dashboard)
        │  HTTPS (JWT via cookie)
        ▼
Backend API (Express + MongoDB)
        │  GitHub OAuth, repo/branch proxy, session + agent-token issuance
        ▼
WebSocket
        │  ws://.../?token=<agent-jwt>
        ▼
Local Agent (runs on the user's own machine)
        │  translate → validate → spawn('git', [...])
        ▼
Real local git repository
```

The backend never touches your filesystem or runs git itself. It only ever talks to the **local agent** — a small Node process you run on your own machine — which is the thing that actually executes `git` against your local repos. Commands are whitelisted, arguments are never shell-interpolated, and destructive operations require explicit confirmation.

## Project structure

This is a monorepo with three independently-run pieces:

| Directory | What it is |
|---|---|
| [`backend/`](backend) | Express API + MongoDB — GitHub OAuth, repo/branch management, the git-command layer, and the WebSocket server the agent connects to |
| [`backend/agent/`](backend/agent) | The local agent — a separate Node process with its own `package.json`, distributed as a standalone downloadable zip (see [backend/agent/README.md](backend/agent/README.md)) |
| [`frontend/`](frontend) | Next.js dashboard — login, repo browser, git workspace panel, agent pairing/status, settings |

Each has its own README/setup instructions; this file is the map, not the manual.

## Getting started (local dev)

You'll need Node.js 22.x, pnpm, and a MongoDB instance.

**1. Backend**
```
cd backend
npm install
cp .env.example .env   # fill in MONGO_URL, GitHub OAuth CLIENT_ID/CLIENT_SECRET, JWT secrets
npm run dev
```

**2. Frontend**
```
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

**3. Local agent** (only needed to actually run git commands against a repo on your machine)
```
cd backend/agent
npm install
node agent.js
```
Then use the "Connect Agent" flow on the dashboard's Agent page to pair it — no manual token copy/paste needed. Full instructions: [backend/agent/README.md](backend/agent/README.md).

## Distributing the agent

Other users don't need to clone this repo to run the agent — a prebuilt zip is published as a GitHub Release asset and offered as a "Download agent" option in the dashboard's topbar and Agent page. To cut a new release:
```
cd backend/agent
npm run build:release
```
then attach the resulting `dist/giteasee-agent.zip` to a GitHub Release tagged `agent-vX.Y.Z`.

## Tech stack

- **Backend:** Express 5, MongoDB/Mongoose, JWT auth, WebSocket (`ws`), Zod validation
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, TanStack Query, Zustand
- **Agent:** plain Node.js, no framework — a thin, whitelisted wrapper around `git` CLI calls

## Docs

Deeper technical docs live under [`backend/docs/`](backend/docs) — product requirements ([`prd.md`](backend/docs/prd.md)), current implementation status ([`PROJECT.md`](backend/docs/PROJECT.md)), API spec, error codes, and database schema.
