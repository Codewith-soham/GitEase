# GitEase — Project Status

**Last Updated:** 2026-07-11
**Scope:** This document describes what is *actually implemented* in the codebase today, as opposed to what's designed/planned in `prd.md` or the `epics/` task breakdowns. Where a designed feature isn't built yet, that's called out explicitly in [Known Gaps](#10-known-gaps--follow-ups).

---

## 1. Overview

GitEase is a visual, collaborative Git workspace built on top of GitHub — it doesn't replace Git or GitHub, it simplifies common workflows while GitHub remains the source of truth for repositories, branches, commits, and permissions (see `backend/docs/prd.md`).

**Concrete shape of the codebase today:**

- A **backend-only** Node.js/Express API (`backend/src/`) backed by MongoDB (Mongoose).
- A **standalone local agent** (`backend/agent/`) — a separate Node process with its own `package.json` that a user runs on their own machine. It connects out to the backend over WebSocket and executes whitelisted `git` commands against a local working directory.
- **No frontend exists yet.** There is no `frontend/` directory, no UI code, and no browser client in this repository.

---

## 2. Architecture at a Glance

```
Browser / API client
        │  HTTPS (JWT: cookie or bearer)
        ▼
Express app (backend/src/app.js)
        │
        ├─ /api/auth/v1        → GitHub OAuth, sessions, JWT, agent tokens
        ├─ /api/repository/v1  → GitHub REST API proxy (repos/branches)
        ├─ /api/automation/v1  → composite push workflow (legacy)
        └─ /api/git/v1         → 9 single-command git endpoints
        │
        ▼
MongoDB (Mongoose) — User, Session, LocalRepo
        │
        ▼
WebSocket server (backend/src/config/webScoket.config.js)
  authenticates agent connections via JWT_AGENT_TOKEN,
  one live connection tracked per userId
        │  ws://.../?token=<agent-jwt>
        ▼
Local Agent (backend/agent/agent.js, runs on the user's machine)
  translateCommand → validateCommand → processManager → gitExecutor
        │
        ▼
  spawn('git', [...]) against a real local repository
```

The backend **never executes git directly** — it always forwards a validated command spec to the connected agent and streams the result back over the same WebSocket connection.

---

## 3. Feature Inventory

### 3.1 Auth (`backend/src/modules/auth/`)

GitHub OAuth login flow, JWT-based session auth, and agent-token issuance.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/v1/github` | GET | No | Redirect to GitHub OAuth authorize URL |
| `/api/auth/v1/github/callback` | GET | No | Exchange OAuth code, create/update user, create session, issue JWT access + refresh tokens |
| `/api/auth/v1/me` | GET | Yes | Return current authenticated user |
| `/api/auth/v1/logout` | POST | Yes | Revoke current session, clear cookies |
| `/api/auth/v1/logoutall` | POST | Yes | Revoke all sessions for the user |
| `/api/auth/v1/refresh-token` | POST | Refresh cookie | Issue new access token from a valid refresh token |
| `/api/auth/v1/sessions` | GET | Yes | List all active sessions for the user |
| `/api/auth/v1/agent-token` | POST / DELETE | Yes | Issue / revoke a long-lived agent token (used by the local agent to authenticate its WebSocket connection) |

Details:
- Access tokens accepted from either an `accessToken` cookie or an `Authorization: Bearer` header (`auth.middleware.js`).
- Sessions capped at **3 per user** — creating a 4th evicts the oldest (`auth.service.js:handleGithubCallBack`).
- `Session` documents carry a `type: 'web' | 'agent'` discriminator; agent tokens live in the same collection with a 90-day expiry and `deviceInfo: 'Local Agent'`.
- Refresh tokens and agent tokens are stored hashed (SHA-256 via `Session.hashToken`), never in plaintext.

### 3.2 Repository (`backend/src/modules/repository/`)

Thin proxy over the GitHub REST API using the user's stored `githubAccessToken` — no local git state.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/repository/v1/repo` | GET | Yes | List the user's GitHub repositories |
| `/api/repository/v1/repo` | POST | Yes | Create a new GitHub repository |
| `/api/repository/v1/repo/:repoName/branches` | GET | Yes | List branches |
| `/api/repository/v1/repo/:repoName/branches` | POST | Yes | Create a branch from a base branch's SHA |
| `/api/repository/v1/repo/:repoName` | DELETE | Yes | Delete a repository |
| `/api/repository/v1/repo/:repoName/branches/:branchName` | DELETE | Yes | Delete a branch |

Also exports `resolveLocalRepoPath(userId, repositoryId)` and `recordLocalRepoPath(userId, repositoryId, localPath)` (added this session, backed by the new `LocalRepo` model) — the mechanism that lets `/api/git/v1/*` resolve a trusted local `cwd` from a client-supplied `repositoryId`, instead of ever trusting a client-supplied path directly. `resolveLocalRepoPath` throws `ApiError(404, "Local repository not found")` when no mapping exists.

### 3.3 Automation (`backend/src/modules/automation/`) — legacy composite workflow

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/automation/v1/push` | POST | Yes | Run `checkout (or create) → init → add → commit → push` as one workflow against the local agent |

Serialized per-user via an in-memory `inFlightUsers` guard (rejects a second push while one is in flight for that user). This is the original, single-purpose workflow that predates the generalized command layer — see [Known Gaps](#10-known-gaps--follow-ups) for a compatibility issue introduced by the Phase 1 agent refactor.

### 3.4 Git (`backend/src/modules/git/`) — generalized single-command layer, added this session

Nine endpoints, one per whitelisted git command, all `verifyJwt`-protected and all resolving `cwd` via `resolveLocalRepoPath(userId, repositoryId)`:

| Route | Request body | Purpose |
|---|---|---|
| `POST /api/git/v1/status` | `{ repositoryId }` | `git status --porcelain=v2 -b` |
| `POST /api/git/v1/add` | `{ repositoryId, files? }` | Stage files (defaults to `.`) |
| `POST /api/git/v1/commit` | `{ repositoryId, commitMessage }` | Commit staged changes |
| `POST /api/git/v1/push` | `{ repositoryId, branch?, remote? }` | Push to a remote branch |
| `POST /api/git/v1/pull` | `{ repositoryId, branch?, remote? }` | Pull from a remote branch |
| `POST /api/git/v1/fetch` | `{ repositoryId }` | Fetch refs without merging |
| `POST /api/git/v1/create-branch` | `{ repositoryId, branch }` | Create and switch to a new branch |
| `POST /api/git/v1/switch-branch` | `{ repositoryId, branch }` | Switch to an existing branch |
| `POST /api/git/v1/delete-branch` | `{ repositoryId, branch, force?, confirmed }` | Delete a branch — **requires `confirmed:true`**, checked before `resolveLocalRepoPath` is ever called |

All responses share the shape `{ exitCode, stdout, stderr }`, wrapped in the standard `ApiResponse` envelope. Full spec: `backend/docs/technical/api_spec.md` §13.

### 3.5 Local Agent (`backend/agent/`) — standalone process, separate `package.json`

Runs on the developer's own machine (`node agent.js`, requires `GITEASE_AGENT_TOKEN`). Connects to the backend over WebSocket and executes git commands locally. Refactored this session from one monolithic file into a pipeline of four modules:

- **`commandTranslator.js`** — pure function `translateCommand({command, files, branch, remote, commitMessage, force})` → `{gitCommand, args}`. Maps the 9 semantic commands to the exact `git` CLI invocation (e.g. `createBranch` → `checkout -b <branch>`, `deleteBranch` → `branch -d|-D <branch>`).
- **`commonValidator.js`** — `validateCommand` whitelists commands (`ALLOWED_COMMANDS`), checks arg-count bounds, rejects unsafe characters (`UNSAFE_PATTERN`), validates branch names (`BRANCH_NAME_PATTERN` / `isSafeBranchName` — no whitespace, no `~^:?*[\``, no leading `-`, no leading/trailing `/`/`.`, no `..`, max 250 chars), validates file paths stay inside `cwd` (`isSafeFilePath`, prevents path escape via `..` or absolute paths), and validates remote names (`/^[a-zA-Z0-9_.-]+$/`).
- **`gitExecutor.js`** — `runGit(gitCommand, args, cwd, callbacks)`, a thin `spawn('git', [...])` wrapper. Args are always passed as an array, never interpolated into a shell string.
- **`processManager.js`** — `runCommand(id, spec, ws)`: per-repo serialization via a `Map<cwd, Set<id>>` (a second concurrent command for the same `cwd` is rejected immediately with `"Another git operation is already running for this repository"`), a 5-minute default timeout (`SIGTERM`, then `SIGKILL` 5s later if still alive), and frame streaming (`started` → `stdout`/`stderr`* → `exit`) via `outputStreamer.sendFrame`.
- **`outputStreamer.js`** — `sendFrame(ws, id, type, extra)`, the single place that shapes `{id, type, ...extra}` JSON frames.
- **`websocketHandler.js`** — owns the `WebSocket` connection lifecycle, wires `translateCommand → validateCommand → processManager.runCommand`, and reconnects with exponential backoff (1s doubling to a 30s cap, reset to 1s on a successful reconnect) if the connection drops.
- **`agent.js`** — reduced to a two-line bootstrap: `createConnection()`.

---

## 4. Security Model

- **Command whitelist only** — nothing outside `ALLOWED_COMMANDS` in `commonValidator.js` can run.
- **No shell interpolation** — `spawn('git', [...])` with array-form args throughout; user input never touches a shell string.
- **Input validation before spawn** — unsafe characters, arg-count bounds, branch-name pattern, file-path containment, and remote-name pattern are all checked agent-side before any `git` process is started.
- **Per-repo serialization** — two concurrent commands against the same local working directory can't race; the second is rejected outright.
- **Confirmation-required destructive ops** — `deleteBranch` requires `confirmed:true` in the request body, checked before any resolution or agent call happens. Other genuinely destructive operations (`reset --hard`, force-push, `rebase`, `clean -fd`) are intentionally kept out of the V1 whitelist entirely.
- **Server-resolved `cwd`, never client-supplied** — `/api/git/v1/*` routes take a `repositoryId` and resolve it to a trusted local path via `resolveLocalRepoPath`; a client can never hand the backend an arbitrary filesystem path to operate on.
- **Hashed token storage** — refresh tokens and agent tokens are stored as SHA-256 hashes, not plaintext, in the `Session` collection.

---

## 5. Data Models (`backend/src/models/`)

| Model | Fields | Notes |
|---|---|---|
| `User` | `githubId`, `username`, `email`, `avatar`, `githubAccessToken` | One document per GitHub-linked user |
| `Session` | `userId`, `refreshToken` (hashed), `type: 'web'\|'agent'`, `deviceInfo`, `ip`, `userAgent`, `lastUsedAt`, `expiresAt` | `expiresAt` has a Mongo TTL index (`expireAfterSeconds: 0`) — expired sessions self-delete |
| `LocalRepo` *(new)* | `userId`, `repositoryId`, `localPath` | Unique compound index on `{userId, repositoryId}`; maps a GitHub repo to the local folder the agent operates on |

---

## 6. Error Contract

Full reference: `backend/docs/technical/ERROR_CODES.md`. Summary by family:

| Family | Examples | Meaning |
|---|---|---|
| `AUTH_001`–`009` | `AUTH_007 AUTHENTICATION_REQUIRED` | Token/session/OAuth failures |
| `USER_001`–`003` | `USER_001 USER_NOT_FOUND` | User lookup/data errors |
| `VALIDATION_001`–`003` | `VALIDATION_002 REQUIRED_FIELD_MISSING` | Generic request validation |
| `SYSTEM_001`–`004` | `SYSTEM_003 DATABASE_ERROR` | Internal/infra failures |
| `AGENT_001`–`007` | `AGENT_001 NOT_CONNECTED`, `AGENT_002 COMMAND_TIMEOUT`, `AGENT_003 COMMAND_FAILED`, `AGENT_004 UNAUTHORIZED_AGENT`, `AGENT_005 PUSH_IN_PROGRESS`, `AGENT_006 INVALID_COMMAND_ARGS`, `AGENT_007 CONFIRMATION_REQUIRED` | Agent/automation-specific errors — `006`/`007` added this session for the generalized git command layer |

Every API error follows `{ success: false, error: { code, message } }`; every success follows `{ success: true, message, data }` (`ApiError`/`ApiResponse` in `backend/src/utils/`).

---

## 7. Full API Surface

| Module | Route prefix | Endpoints |
|---|---|---|
| Auth | `/api/auth/v1` | `github` (GET), `github/callback` (GET), `me` (GET), `logout` (POST), `logoutall` (POST), `refresh-token` (POST), `sessions` (GET), `agent-token` (POST/DELETE) |
| Repository | `/api/repository/v1` | `repo` (GET/POST), `repo/:repoName/branches` (GET/POST), `repo/:repoName` (DELETE), `repo/:repoName/branches/:branchName` (DELETE) |
| Automation | `/api/automation/v1` | `push` (POST) |
| Git | `/api/git/v1` | `status`, `add`, `commit`, `push`, `pull`, `fetch`, `create-branch`, `switch-branch`, `delete-branch` — all POST |

All routes except `github`, `github/callback`, and `refresh-token` require `verifyJwt`.

---

## 8. Environment Variables

**Backend** (`backend/.env`):
`PORT`, `MONGO_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `JWT_ACCESS_TOKEN`, `JWT_ACCESS_TOKEN_EXPIRY`, `JWT_REFRESH_TOKEN`, `JWT_REFRESH_TOKEN_EXPIRY`, `JWT_AGENT_TOKEN`, `JWT_AGENT_TOKEN_EXPIRY`

**Local Agent** (`backend/agent`, process env):
`GITEASE_BACKEND_URL` (defaults to `ws://localhost:5000`), `GITEASE_AGENT_TOKEN` (required — agent exits if unset)

---

## 9. Testing

- **`backend/src/tests/auth.test.js`** (Node's built-in test runner + `supertest`): covers GitHub OAuth redirect URL construction, access/refresh JWT generation, `Session.hashToken` determinism, `asyncHandler` error propagation, `ApiError`/`ApiResponse` shape, `verifyJwt` middleware (cookie auth, bearer auth, missing token, user-not-found), and integration tests for `/me`, `/logout`, `/logoutall`, `/refresh-token`, `/sessions`.
- **No automated tests exist yet** for the repository module, automation module, git module, or the local agent (`translateCommand`/`commonValidator`/`processManager` etc.) — these were verified manually this session (see §10) but have no regression coverage in the test suite.
- Run tests: `npm test` (from `backend/`) → `node --test src/tests/auth.test.js`.

---

## 10. Known Gaps / Follow-ups

- **No frontend.** Nothing in this repo renders a UI; GitEase today is API + local agent only.
- **`automation.service.js`'s push workflow is currently broken** against the new agent. It sends raw low-level commands (e.g. `{command: 'checkout', args: ['-b', branch]}`) directly, but the Phase 1 agent refactor's `websocketHandler` now runs every incoming payload through `translateCommand`, which only recognizes the 9 semantic command names (`status`, `add`, `commit`, `push`, `pull`, `fetch`, `createBranch`, `switchBranch`, `deleteBranch`) — not raw `'checkout'`. Every step of the push workflow will hit `translateCommand`'s `Unknown command` error until this workflow is migrated to the semantic command set (most likely superseded entirely by `/api/git/v1/*`).
- **`recordLocalRepoPath` has no caller yet.** There is no `clone`/`init` flow anywhere in the backend that populates the `LocalRepo` mapping, so every `/api/git/v1/*` call will 404 with `"Local repository not found"` until either such a flow is built or mappings are seeded some other way.
- **Phase 2 (full-stack) verification hasn't been run.** Phase 1 (agent-only: all 9 commands, path-escape rejection, flag-injection rejection, per-repo serialization) was verified end-to-end against a real local repo + bare remote this session. Phase 2 (live GitHub OAuth login → agent-token issuance → running agent → exercising all 9 `/api/git/v1/*` endpoints over HTTP) requires a running MongoDB instance and a real GitHub OAuth app and hasn't been exercised.
- **`git.controller.js`/`git.service.js` have no automated tests** (see §9).

---

## 11. Roadmap Context

Per `backend/docs/prd.md` §12, GitEase's roadmap is:

1. **Phase 1 — Git Automation**: simplify common Git operations, integrate with GitHub. *(mostly built: repository proxy + the 9-command git layer)*
2. **Phase 2 — Local Development Agent**: execute Git operations locally without terminal interaction. *(built: `backend/agent/`)*
3. **Phase 3 — Collaborative Workspace**: shared project/repo coordination. *(not started)*
4. **Phase 4 — Engineering Intelligence**: analytics, monitoring, AI assistance. *(not started, explicitly out of V1 scope per PRD §10)*

Current position: the backend command layer and local agent (roadmap Phases 1–2) are functionally built and Phase-1-verified; there is no UI, no collaboration layer, and no analytics — those are entirely future work.
