# Git Automation Layer — Task Breakdown

Companion checklist for generalizing the local agent from the single hardcoded push workflow into the full V1 command set (status, add, commit, push, pull, fetch, createBranch, switchBranch, deleteBranch). Full design/context lives in `backend/docs/technical/git_automation_design.md` (or the plan it was generated from); this file exists so each task can be handed to a **fresh** Claude Code session one at a time (CLAUDE.md loads automatically — no need to re-explain project conventions), instead of carrying one huge running conversation.

Work is grouped into phases. Do phases in order; within a phase, do tasks in order — each depends on the previous one.

**Decisions locked in (carried over from the push-workflow design, still true here):**
- Local agent authenticates over WebSocket with the existing agent JWT (`GITEASE_AGENT_TOKEN`) — unchanged.
- `child_process.spawn('git', [...])` with array-form args, never a shell string — unchanged, and now enforced more strictly via a translator layer.
- Wire protocol frame shape `{id, type, ...}` — unchanged; only new `type` values and new semantic request fields are added, not a new transport.
- `deleteBranch` is the only V1 command requiring explicit confirmation (`confirmed: true`); destructive ops (`reset --hard`, force-push, `rebase`, `clean -fd`) stay out of the whitelist entirely in V1.

---

## Phase 1 — Agent-Side Foundation

Goal: the local agent can safely translate, validate, and execute all 9 commands (existing: clone, init, status, add, commit, checkout, push, pull; new: fetch, createBranch, switchBranch, deleteBranch — note `checkout` is superseded by `createBranch`/`switchBranch` conceptually but the underlying git call is the same) without depending on backend changes yet.

### Task 1.1 — Command translator

- [ ] Not started

**Files:** `backend/agent/commandTranslator.js` (new)

**Prompt:**
> Create `backend/agent/commandTranslator.js`. Export a single function `translateCommand({ command, files, branch, remote, commitMessage, force })` that returns the exact `args` array to pass to `spawn('git', [command, ...args])` for each of these commands: `status` → `['--porcelain=v2', '-b']`; `add` → `['--', ...(files && files.length ? files : ['.'])]`; `commit` → `['-m', commitMessage]`; `push` → `['-u', remote || 'origin', branch]`; `pull` → `branch ? [remote || 'origin', branch] : [remote || 'origin']`; `fetch` → `[remote || 'origin']`; `createBranch` → `['-b', branch]` (git command stays `checkout`); `switchBranch` → `[branch]` (git command stays `checkout`); `deleteBranch` → `[force ? '-D' : '-d', branch]` (git command stays `branch`). For `createBranch`/`switchBranch`, also return the actual git subcommand to run (`checkout`), since it differs from the `command` field name — return `{ gitCommand, args }` from the function, where `gitCommand` defaults to `command` itself except for `createBranch`/`switchBranch` (→ `'checkout'`) and `deleteBranch` (→ `'branch'`). Keep this file dependency-free (no fs, no child_process) — pure data transformation only, so it's trivially unit-testable later.

---

### Task 1.2 — Validator extension

- [ ] Not started

**Files:** `backend/agent/commonValidator.js`

**Prompt:**
> Depends on Task 1.1. Extend `backend/agent/commonValidator.js`. Add to `ALLOWED_COMMANDS`: `fetch: { minArgs: 1, maxArgs: 1 }`, `createBranch: { minArgs: 1, maxArgs: 2 }` (maps to `checkout -b <branch>`), `switchBranch: { minArgs: 1, maxArgs: 1 }` (maps to `checkout <branch>`), `deleteBranch: { minArgs: 2, maxArgs: 2 }` (maps to `branch -d|-D <branch>`). Add a `BRANCH_NAME_PATTERN` regex enforcing: no whitespace, none of `~^:?*[\`, no leading `-`, no leading/trailing `/` or `.`, no `..`, max length 250 — and a `isSafeBranchName(name)` helper using it. Add a `isSafeFilePath(file, cwd)` helper that resolves `path.resolve(cwd, file)` and rejects (returns false) if the result does not start with `path.resolve(cwd)` (prevents path-escape via absolute paths or crafted relatives), unless `file === '.'`. Update `validateCommand` so that after the existing arg-count and `isSafeArg` checks, it additionally: (a) for `add`, runs every arg except `'.'` through `isSafeFilePath`; (b) for any command whose args contain a branch name (`checkout`/`createBranch`/`switchBranch`/`deleteBranch` — the branch is the last arg, or the arg after `-b`/`-D`/`-d`), runs it through `isSafeBranchName`; (c) for `push`/`pull`/`fetch`, validates the remote-name arg (if present) against `/^[a-zA-Z0-9_.-]+$/`. Keep all existing behavior (existing commands, `UNSAFE_PATTERN`, `validateCwd`, the `clone`/`init` exemption from `requireGitRepo`) unchanged.

---

### Task 1.3 — Agent module split (gitExecutor, processManager, outputStreamer, websocketHandler)

- [ ] Not started

**Files:** `backend/agent/gitExecutor.js`, `backend/agent/processManager.js`, `backend/agent/outputStreamer.js`, `backend/agent/websocketHandler.js` (all new), `backend/agent/agent.js` (rewritten to use them)

**Prompt:**
> Depends on Tasks 1.1–1.2. Refactor `backend/agent/agent.js`'s inline logic into four new files, preserving current behavior exactly (this is a structural extraction, not a behavior change) and adding the two new pieces of behavior called out below.
>
> `backend/agent/gitExecutor.js`: export `runGit(gitCommand, args, cwd, { onStdout, onStderr, onError, onExit })` — wraps `spawn('git', [gitCommand, ...args], { cwd })`, wiring the four callbacks to the child's `stdout`/`stderr`/`error`/`close` events (mirror exactly what `agent.js` currently does inline), and returns the `ChildProcess` handle so the caller can track/kill it.
>
> `backend/agent/processManager.js`: export `runCommand(id, { command, args, cwd, gitCommand }, ws)` — maintains a module-level `Map<cwd, Set<id>>` (repo → in-flight request ids) and a `Map<id, ChildProcess>`; before calling `gitExecutor.runGit`, if `cwdMap.get(cwd)` already has an entry, send `{id, type:'error', message:'Another git operation is already running for this repository'}` back over `ws` and return early instead of spawning (per-repo serialization — prevents two concurrent git processes mutating the same working tree). Otherwise register the id under that cwd, call `gitExecutor.runGit`, send a `{id, type:'started', command}` frame immediately after spawning (new event), forward stdout/stderr/error/exit frames via `outputStreamer`, and remove the id from the cwd's set when the process closes or errors. Add a 5-minute default timeout per command: if the process hasn't closed within that window, `child.kill('SIGTERM')`, then `SIGKILL` after 5 more seconds if still alive, and send a `{id, type:'error', message:'Command timed out'}` frame.
>
> `backend/agent/outputStreamer.js`: export `sendFrame(ws, id, type, extra)` — a tiny wrapper around `ws.send(JSON.stringify({ id, type, ...extra }))`, used by `processManager` for every frame type (`started`, `stdout`, `stderr`, `error`, `exit`) so the JSON-shaping logic lives in one place.
>
> `backend/agent/websocketHandler.js`: export `createConnection()` — owns the `new WebSocket(...)` call (using `GITEASE_BACKEND_URL`/`GITEASE_AGENT_TOKEN` from env, matching current `agent.js` behavior), the `open`/`close`/`error` handlers (keep existing console logging), and the `message` handler that parses JSON, calls `translateCommand` (Task 1.1) to get `{gitCommand, args}`, calls `validateCommand` (Task 1.2, passing the translated args) for validation, and on success calls `processManager.runCommand`. On `close`, add simple reconnect-with-backoff: retry after 1s, doubling up to a 30s cap, resetting to 1s on a successful `open`.
>
> Finally, reduce `backend/agent/agent.js` to just `import { createConnection } from './websocketHandler.js'; createConnection()`.

---

## Phase 2 — Backend Command Layer

Goal: the backend can send any of the 9 whitelisted commands to the agent, with proper per-user serialization and typed error mapping, and resolves `cwd` safely from a `repositoryId` rather than trusting a raw path from the client.

### Task 2.1 — Generalize `runAgentCommand` beyond the push workflow

- [ ] Not started

**Files:** `backend/src/services/agent.services.js`

**Prompt:**
> Depends on Phase 1. `backend/src/services/agent.services.js` already sends `{id, command, args, cwd}` and resolves on the `exit` frame — that part doesn't need to change. Add handling for the new `started` frame type in `handleAgentMessage`'s switch statement: on `type === 'started'`, do nothing to the pending promise (it's informational only) but if a `pending.onStarted` callback was provided in the original `runAgentCommand({ ... }, { timeoutMs, onStarted })` options, invoke it. Update `runAgentCommand`'s signature to accept `{ command, gitCommand, args, cwd }` (the extra `gitCommand` field distinguishes the semantic command name from git's actual subcommand, per Task 1.1's `createBranch`/`switchBranch`/`deleteBranch` mapping) and forward `gitCommand` in the WS payload the agent expects (`{id, command: gitCommand || command, args, cwd}` — since the agent's `websocketHandler` from Task 1.3 already runs commands through `translateCommand`/`validateCommand` using the semantic `command` field, confirm with Task 1.3's actual wiring whether translation happens agent-side or backend-side, and keep this consistent — translation should happen once, agent-side, so this task should just pass `command` through unchanged and let the agent translate). Keep `inFlightUsers` as-is; it's superseded by `processManager`'s per-repo serialization from Task 1.3 for git-process-level races, but is still useful as a coarser per-user guard for the composite push workflow — leave it in place, don't remove it.

---

### Task 2.2 — `repositoryId` → validated local path resolution

- [ ] Not started

**Files:** `backend/src/modules/repository/repository.service.js`, `backend/src/modules/repository/repository.repository.js` (new, if a local-path record doesn't exist yet)

**Prompt:**
> Depends on Task 2.1. Inspect `backend/src/modules/repository/repository.service.js` — it currently only talks to the GitHub API (`getRepos`, `createRepository`, `createBranch`, `listBranch`, `deleteRepo`, `deleteBranch`) and has no concept of a local filesystem path. Local git commands need a `cwd`, but the client must never be trusted to supply one directly. Design and implement a `resolveLocalRepoPath(userId, repositoryId)` function: if there's no existing storage for "which local folder did this user clone repository X into," add a minimal one — either a new field on an existing per-user document or a small new Mongoose model (`backend/src/models/localRepo.model.js`) mapping `{ userId, repositoryId, localPath }`, populated whenever a `clone`/`init` command succeeds (wire this into wherever the clone/init flow currently lives, or note it as a follow-up if no such flow exists yet — check `backend/src/modules/automation/` and `backend/agent/` call sites first). `resolveLocalRepoPath` should throw `ApiError(404, "Local repository not found")` if no mapping exists for that user+repositoryId, and otherwise return the stored `localPath` for use as `cwd`. This is the function every new route in Task 2.3 calls before invoking `runAgentCommand` — it is the mechanism that prevents a client-supplied `cwd` from ever reaching the agent unchecked.

---

### Task 2.3 — Individual command routes

- [ ] Not started

**Files:** `backend/src/modules/git/{git.routes,git.controller,git.service}.js` (new), `backend/src/app.js`

**Prompt:**
> Depends on Tasks 2.1–2.2. Create a new `backend/src/modules/git/` module, following the layered pattern of `backend/src/modules/automation/`. `git.service.js` exports one function per command — `getStatus`, `addFiles`, `commitChanges`, `pushChanges`, `pullChanges`, `fetchRemote`, `createBranch`, `switchBranch`, `deleteBranch` — each taking `(userId, { repositoryId, ...commandSpecificFields })`, calling `resolveLocalRepoPath` (Task 2.2) to get `cwd`, then calling `runAgentCommand(userId, { command: '<name>', ...fields, cwd })` (Task 2.1), and returning `{ exitCode, stdout, stderr }` directly (no extra wrapping — match the shape `runAgentCommand` already resolves). `deleteBranch` additionally requires `confirmed === true` in the request body, throwing `ApiError(400, "Deletion must be confirmed")` if missing or false, before calling `resolveLocalRepoPath`. `git.controller.js` exports one asyncHandler per function, reading the relevant fields from `req.body` and returning `new ApiResponse(200, result, "<Command> completed")`, following the exact style of `automation.controller.js`. `git.routes.js` exposes: `router.route('/status').post(verifyJwt, getStatus)`, `/add`, `/commit`, `/push`, `/pull`, `/fetch`, `/create-branch`, `/switch-branch`, `/delete-branch` — all `verifyJwt`-protected POST routes. Mount it in `backend/src/app.js` as `app.use('/api/git/v1', gitRouter)`, following the existing pattern for `automationRouter`.

---

## Phase 3 — Docs & Error Codes Sync

Goal: the error-code contract and API spec reflect the new endpoints and the new validation-failure-vs-command-failure distinction, so frontend engineers have a stable reference.

### Task 3.1 — Error codes

- [ ] Not started

**Files:** `backend/docs/technical/ERROR_CODES.md`

**Prompt:**
> Depends on Phase 2 being implemented (so the actual behavior is known). In `backend/docs/technical/ERROR_CODES.md`'s "Agent & Automation Errors" table (section 8), add two new rows following the existing style: `AGENT_006 | 400 | INVALID_COMMAND_ARGS | Command failed agent-side validation before it was ever spawned (unsafe path, branch name, or argument).` and `AGENT_007 | 400 | CONFIRMATION_REQUIRED | A confirmation-required command (e.g. delete branch) was sent without confirmed:true.` Bump the Revision History (section 12) with a new `v0.3` row: "Added AGENT_006–AGENT_007 for the generalized git command layer."

---

### Task 3.2 — API spec

- [ ] Not started

**Files:** `backend/docs/technical/api_spec.md`

**Prompt:**
> Depends on Task 2.3. In `backend/docs/technical/api_spec.md`, add entries for all nine new endpoints under `/api/git/v1/`: `POST /status`, `/add`, `/commit`, `/push`, `/pull`, `/fetch`, `/create-branch`, `/switch-branch`, `/delete-branch`. For each, follow the existing entries' format in that file (method, path, auth requirement, request body shape, response shape, relevant error codes). Request bodies: `status`/`fetch` take `{ repositoryId }`; `add` takes `{ repositoryId, files? }`; `commit` takes `{ repositoryId, commitMessage }`; `push`/`pull` take `{ repositoryId, branch?, remote? }`; `create-branch`/`switch-branch` take `{ repositoryId, branch }`; `delete-branch` takes `{ repositoryId, branch, force?, confirmed }`. All responses are `{ exitCode, stdout, stderr }` wrapped in the standard `ApiResponse` envelope. Reference `AGENT_001`–`AGENT_007` as the relevant error codes for this endpoint group.

---

## Verification

After Phase 1 (agent-only):
1. Run `node backend/agent/agent.js` against a real local git repo with a remote configured.
2. Manually send each of the 9 command frames (`status`, `add`, `commit`, `push`, `pull`, `fetch`, `createBranch`, `switchBranch`, `deleteBranch`) over the WebSocket connection (e.g. via a throwaway `wscat` script) and confirm: a `started` frame arrives first, output streams correctly, and the final `exit` code matches what running the equivalent `git` command by hand would produce.
3. Attempt a path-escape (`files: ['../../etc/passwd']`) and a flag-injection branch name (`branch: '-D'`) — confirm both are rejected agent-side with a `type: 'error'` frame, never reaching `spawn`.
4. Start two `push` requests for the same `cwd` back-to-back — confirm the second is rejected with the per-repo-serialization error rather than racing.

After Phase 2 (full stack):
1. Log in via GitHub OAuth, issue an agent token, start the agent, confirm the backend shows an authenticated connection.
2. Exercise each of the 9 `/api/git/v1/*` endpoints against a real repo end-to-end; confirm responses match the `{exitCode, stdout, stderr}` shape.
3. Call `delete-branch` without `confirmed: true` — confirm it's rejected with `AGENT_007` before any agent call is made.
4. Call any endpoint with a `repositoryId` that has no local-path mapping — confirm `404 Local repository not found`, and that no request ever reaches the agent in that case.

