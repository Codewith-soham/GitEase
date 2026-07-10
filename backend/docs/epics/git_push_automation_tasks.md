# Git Push Automation — Task Breakdown

Companion checklist for the "click push → agent runs `git init && git add . && git commit -m ... && git push`" feature. Full architecture/context lives in the plan this was generated from; this file exists so each task can be handed to a **fresh** Claude Code session one at a time (CLAUDE.md loads automatically — no need to re-explain project conventions), instead of carrying one huge running conversation.

Do the tasks in order — each depends on the previous one.

**Decisions locked in:**
- Local agent authenticates over WebSocket with a dedicated, long-lived **agent token** (separate from the browser's short-lived access token), built on the existing JWT + `Session` infra.
- `git push` always runs as `push -u origin <branch>` (sets upstream on first push too).
- Remote (`origin`) is assumed to already exist — no `git remote add` step in this pass.

---

## Task 1 — Agent token: data layer & token utils

- [ ] Not started

**Files:** `backend/src/models/session.model.js`, `backend/src/utils/tokenGenration.js`, `backend/README.md`, `backend/.env`

**Prompt:**
> In `backend/src/models/session.model.js`, add a `type` field to `sessionSchema`: `{ type: String, enum: ['web', 'agent'], default: 'web' }`. Don't touch anything else in the schema. Then in `backend/src/utils/tokenGenration.js`, add `generateAgentToken(userId)` and `verifyAgentToken(token)`, mirroring the existing `generateRefreshToken`/`verifyRefreshToken` pair exactly but signing/verifying with a new `process.env.JWT_AGENT_TOKEN` secret and `process.env.JWT_AGENT_TOKEN_EXPIRY` expiry, and including `{ userId, type: 'agent' }` as the payload. Add `JWT_AGENT_TOKEN` and `JWT_AGENT_TOKEN_EXPIRY` (default suggestion `90d`) to the required env vars list in `backend/README.md` and to `.env`. Export the two new functions alongside the existing ones.

---

## Task 2 — Agent token: issue & revoke API

- [ ] Not started

**Files:** `backend/src/modules/auth/{auth.repository,auth.service,auth.controller,auth.routes}.js`

**Prompt:**
> Depends on Task 1 being done. In `backend/src/modules/auth/auth.repository.js`, add `findAgentSessionByToken(hashedToken)` (same shape as `findSessionByToken` but query `{ refreshToken: hashedToken, type: 'agent' }`) and `deleteAgentSessions(userId)` (`Session.deleteMany({ userId, type: 'agent' })`). In `auth.service.js`, add `createAgentToken(userId)`: call `generateAgentToken(userId)` from `tokenGenration.js`, hash it with `Session.hashToken`, store it via the existing `createSession` repository function with `{ userId, refreshToken: hashedToken, type: 'agent', deviceInfo: 'Local Agent', expiresAt: <90 days out> }`, and return the **raw** (unhashed) token — it can never be retrieved again after this. Also add `revokeAgentTokens(userId)` calling `deleteAgentSessions`. In `auth.controller.js`, add `generateAgentToken` and `revokeAgentToken` controllers (asyncHandler + ApiResponse, following the exact style of the existing controllers in this file). In `auth.routes.js`, add `router.route("/agent-token").post(verifyJwt, generateAgentToken).delete(verifyJwt, revokeAgentToken)`.

---

## Task 3 — WebSocket authentication & connection registry

- [ ] Not started

**Files:** `backend/src/config/webScoket.config.js`

**Prompt:**
> Depends on Tasks 1–2. Rewrite `backend/src/config/webScoket.config.js` so that: (1) `wss.on('connection', (ws, req) => ...)` parses a `token` query param off `req.url`; (2) it calls `verifyAgentToken` (from `tokenGenration.js`) and, on success, hashes the raw token with `Session.hashToken` and looks it up via `findAgentSessionByToken` to confirm it hasn't been revoked (mirror how `refreshAccessToken` in `auth.service.js` double-checks refresh tokens against the DB) — reject with `ws.close(4001, 'Unauthorized')` on any failure, before registering anything; (3) maintain a module-level `Map<userId, WebSocket>`; on a new authenticated connection for a userId already in the map, `terminate()` the stale old socket first; remove the entry in the `close` handler; (4) export `getAgentConnection(userId)` for other modules; (5) on `message`, instead of `console.log`, call an (as-yet-unwritten) `handleAgentMessage(userId, data)` — for now import it from `../services/agent.services.js` (Task 4 will create that file) and just wire the call through.

---

## Task 4 — Agent command service

- [ ] Not started

**Files:** `backend/src/services/agent.services.js` (new)

**Prompt:**
> Depends on Task 3. Create `backend/src/services/agent.services.js`, following the same "external-service boundary" role that `backend/src/services/github.services.js` plays for GitHub — this is the only place that talks to the local agent over WebSocket. Export `runAgentCommand(userId, { command, args, cwd }, { timeoutMs = 60000 } = {})`: look up the connection via `getAgentConnection` from `../config/webScoket.config.js`; if none, `throw new ApiError(409, "Local agent not connected")`; otherwise generate `const id = crypto.randomUUID()`, send `JSON.stringify({ id, command, args, cwd })` over the socket, and return a Promise that resolves `{ exitCode, stdout, stderr }` when a matching `exit` message arrives (accumulate `stdout`/`stderr` chunks as they stream in), rejects on a matching `error` message, and rejects with `ApiError(504, "Agent command timed out")` if nothing arrives within `timeoutMs` (clear the timer on settle). Track pending requests in a module-level `Map<id, {resolve, reject, stdout, stderr, timer}>`. Also export `handleAgentMessage(userId, data)` (called from Task 3's WS message handler) that parses the JSON frame and routes it to the matching pending entry by `id`. Finally, add a simple per-user in-flight guard: a module-level `Set<userId>` — `runAgentCommand`'s caller (the automation service in Task 5) will manage adding/removing from it, so just export the `Set` itself as `inFlightUsers` for now.

---

## Task 5 — Automation module: push workflow

- [ ] Not started

**Files:** `backend/src/modules/automation/{automation.routes,automation.controller,automation.service}.js` (new), `backend/src/app.js`

**Prompt:**
> Depends on Task 4. Create a new `backend/src/modules/automation/` module following this repo's layered pattern (see `backend/src/modules/repository/` for the shape — no repository.js needed here since there's no DB access, same as that module). `automation.service.js` exports `runPushWorkflow(userId, { cwd, branch, commitMessage })`: guard against concurrent runs using `inFlightUsers` from `agent.services.js` (throw `ApiError(409, "A push is already in progress")` if the userId is already in the set, otherwise add it and remove it in a `finally`), then sequentially `await runAgentCommand` for: `{ command: 'init', args: [] }`, `{ command: 'add', args: ['.'] }`, `{ command: 'commit', args: ['-m', commitMessage || 'automated commit'] }`, `{ command: 'push', args: ['-u', 'origin', branch] }` — always passing `cwd`. Collect each step's result into an array (`{ step, exitCode, stdout, stderr }`). Stop and return early (don't run later steps) if a step fails, EXCEPT: if the `commit` step fails specifically because there was nothing to commit (its `stdout`/`stderr` contains `"nothing to commit"`), treat that as non-fatal and continue on to `push`. Return the full array of step results. `automation.controller.js` exports `pushChanges` (asyncHandler) reading `{ cwd, branch, commitMessage }` from `req.body`, calling `runPushWorkflow(req.user._id, req.body)`, returning `new ApiResponse(200, results, "Push workflow completed")`. `automation.routes.js` exposes `router.route("/push").post(verifyJwt, pushChanges)`. Mount it in `backend/src/app.js` as `app.use('/api/automation/v1', automationRouter)`, following the existing pattern for `repositoryRouter`.

---

## Task 6 — Local agent fixes

- [ ] Not started

**Files:** `backend/agent/agent.js`, `backend/agent/commonValidator.js`

**Prompt:**
> In `backend/agent/commonValidator.js`: change `push: { minArgs: 0, maxArgs: 2 }` to `maxArgs: 3` (to allow `-u origin <branch>`), and change `const requireGitRepo = command !== 'clone'` to `const requireGitRepo = !['clone', 'init'].includes(command)` (both bootstrap commands must not require `.git` to already exist — that was backwards for `init`). In `backend/agent/agent.js`: fix the import `from './commandValidator.js'` to the real filename `from './commonValidator.js'`. Read `GITEASE_BACKEND_URL` (default `'ws://localhost:5000'`) and `GITEASE_AGENT_TOKEN` (required — if missing, log a clear error and `process.exit(1)`) from `process.env`, and connect with `new WebSocket(\`${backendUrl}?token=${agentToken}\`)` instead of the hardcoded URL. Finally, thread the incoming `id` field through to every outgoing message: `ws.send(JSON.stringify({ id, type: 'stdout', data: ... }))` etc. for `stdout`, `stderr`, `error`, and `exit` — destructure `id` from the parsed/validated payload alongside `command`, `args`, `cwd`.

---

## Task 7 — Docs sync

- [ ] Not started

**Files:** `backend/docs/technical/ERROR_CODES.md`, `backend/docs/technical/api_spec.md`, `backend/README.md`

**Prompt:**
> Depends on Tasks 1–6 being implemented (so the actual behavior is known). In `backend/docs/technical/ERROR_CODES.md`, replace the bare `AGENT_XXX` line under "Future Modules" with a proper table entry (matching the style of the "System Errors" table above it) defining: `AGENT_001 NOT_CONNECTED (409)`, `AGENT_002 COMMAND_TIMEOUT (504)`, `AGENT_003 COMMAND_FAILED (422)`, `AGENT_004 UNAUTHORIZED_AGENT (401)`, `AGENT_005 PUSH_IN_PROGRESS (409)`. In `backend/docs/technical/api_spec.md`, add entries for `POST /api/auth/v1/agent-token`, `DELETE /api/auth/v1/agent-token`, and `POST /api/automation/v1/push` (request/response shape), following the existing entries' format in that file. Confirm `backend/README.md` already lists `JWT_AGENT_TOKEN`/`JWT_AGENT_TOKEN_EXPIRY` from Task 1; if not, add them.

---

## Verification (after Task 6)

1. Start the backend, log in via GitHub OAuth to get a browser session.
2. `POST /api/auth/v1/agent-token` with the browser's access token → get a raw agent token; confirm a `Session` doc exists with `type: 'agent'`.
3. Set `GITEASE_AGENT_TOKEN`/`GITEASE_BACKEND_URL` env vars and run `node backend/agent/agent.js` against a real local git repo with a remote already configured — confirm the backend logs an authenticated connection.
4. Change a file, `POST /api/automation/v1/push` with `{ cwd, branch, commitMessage }` — confirm all four steps succeed and the commit lands on GitHub.
5. Re-run with no file changes — confirm "nothing to commit" doesn't cause a false failure.
6. Kill the agent, call push again — confirm `409 Local agent not connected`.
7. `DELETE /api/auth/v1/agent-token`, restart the agent with the revoked token — confirm the connection is rejected immediately.
