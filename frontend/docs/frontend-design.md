# GitEase Frontend Design — Core Authenticated App

> **How to use this file:** Each phase below is independent and ordered. To implement a phase in a fresh Claude Code session, use the **Prompt** block at the end of that phase. Every prompt tells Claude to read this file first, so you never need to re-explain context. Complete phases in order — each builds on the previous one.

---

## 1. Shared Context (read once, applies to every phase)

### Product
GitEase is a visual Git workspace on top of GitHub for beginners and small teams. The backend (Express, `http://localhost:5000`) proxies GitHub's API and relays git commands over WebSocket to a **local desktop agent** running on the user's machine. The frontend (Next.js, `http://localhost:3000`) already has a finished public marketing site + login page. This design covers the **authenticated app only**.

### What already exists — DO NOT touch
- Public marketing pages: `src/app/(public)/**` (GSAP/Lenis animations)
- Login: `src/app/(public)/login/`, `src/features/auth/components/{login-layout,auth-card,terminal-animation}.tsx`
- `src/features/workspace/components/workspace-dashboard.tsx` — decorative mock used by the landing page
- Root `src/app/layout.tsx` visuals, `src/app/globals.css` tokens, `src/components/ui/button.tsx`

### Stack & conventions
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 (CSS-first), shadcn **base-nova** style (Base UI primitives, NOT Radix), lucide icons, pnpm
- Alias `@/*` → `src/*`; feature-sliced layout: `src/features/<feature>/{api,components,hooks,store,types}`
- Design language: dark-only OKLCH theme; reuse `globals.css` utilities `.glass`, `.text-gradient`, `.glow-purple`, `.glow-cyan` and tokens `--purple`, `--cyan`; `cn` from `src/lib/utils.ts`
- Data layer: **TanStack Query** for all server state, **Zustand** for UI-only state
- Env: `NEXT_PUBLIC_API_URL=http://localhost:5000` (convention already used in `auth-card.tsx`)
- Backend runs `npm run dev` in `backend/`; agent runs `node agent.js` in `backend/agent/` with env `GITEASE_AGENT_TOKEN` (+ optional `GITEASE_BACKEND_URL=ws://localhost:5000`)

### Verified backend facts (build against these, not the docs in backend/docs)
- **Success envelope:** `{ statusCode, data, message, success }` → always unwrap `data`
- **Error envelope:** `{ success: false, message, errors }` — **there are NO error codes** (`backend/src/middleware/error.middleware.js`). Discriminate on HTTP status + message substring:
  - `401` → single-flight `POST /api/auth/v1/refresh-token`, retry original once; refresh fails → logged out
  - `409` + `/agent not connected/i` → **agent offline** UI state (common!)
  - `404` + `/local repository not found/i` → **repo not connected** UI state
  - `504` → agent timeout toast; other `409` → "operation already running" toast
  - `400` + "Deletion must be confirmed" → guarded by the confirm dialog
- **Failed git commands return HTTP 200** with `{ exitCode, stdout, stderr }` — success is `exitCode === 0`, never HTTP status
- **Auth is cookie-based:** httpOnly `accessToken`/`refreshToken` cookies on `localhost` (host-only → port-agnostic, sameSite lax). Every fetch needs `credentials: 'include'`. Login = full-page redirect to `GET /api/auth/v1/github` (already wired)
- `GET /api/repository/v1/repo` returns `fullname: undefined` (backend maps `repo.fullname`, GitHub sends `full_name`) — always fall back to `name`
- Server-side delete routes for GitHub repo/branch are buggy (may 500) — handle failure gracefully with a toast

### API surface
| Area | Endpoints (all `credentials:'include'`) |
|---|---|
| Auth `/api/auth/v1` | `GET /me`, `POST /logout`, `POST /logoutall`, `POST /refresh-token`, `GET /sessions`, `POST /agent-token` (returns raw token string ONCE), `DELETE /agent-token` |
| Repos `/api/repository/v1` | `GET /repo`, `POST /repo {name, private, description, auto_init}`, `GET /repo/:repoName/branches`, `POST /repo/:repoName/branches {branchName, baseBranch}`, `DELETE /repo/:repoName`, `DELETE /repo/:repoName/branches/:branchName` |
| Git `/api/git/v1` (all POST, all take `repositoryId`, all return `{exitCode, stdout, stderr}`) | `/status` (porcelain v2 -b output), `/add {files?}`, `/commit {commitMessage}`, `/push {branch?, remote?}`, `/pull`, `/fetch`, `/create-branch {branch}`, `/switch-branch {branch}`, `/delete-branch {branch, force?, confirmed:true}` |
| **Added in Phase 0** `/api/git/v1` | `POST /local-repo {repositoryId, localPath}`, `GET /local-repo`, `DELETE /local-repo/:repositoryId`, `GET /agent-status` → `{connected: boolean}` |

### Route map (authenticated app)
```
(dashboard)/layout.tsx        Providers → AuthGate → AppShell
  /dashboard                  home: stats, recent repos, quick actions
  /repositories               repo grid + create dialog
  /repositories/[repoName]    git workspace panel + terminal panel
  /agent                      agent status, setup steps, token, connected folders
  /settings                   profile, sessions, danger zone
```
`activity/`, `teams/`, `workspace/` route folders stay as `.gitkeep` (out of scope this pass).

---

## Phase 0 — Backend: local-repo + agent-status endpoints

**Why:** Every `/api/git/v1/*` call 404s today because nothing writes the `LocalRepo` mapping (`recordLocalRepoPath` in `backend/src/modules/repository/repository.service.js:88` has no caller), and no agent-status endpoint exists for the topbar indicator.

**Changes** (follow the existing routes → asyncHandler controller → service → repository pattern):
1. `backend/src/modules/repository/repository.repository.js` — add `listLocalRepos(userId)` (`LocalRepo.find`), `deleteLocalRepo(userId, repositoryId)` (`findOneAndDelete`)
2. `backend/src/modules/repository/repository.service.js` — add:
   - `validateLocalPath(p)`: string, <500 chars, absolute (`path.win32.isAbsolute(p) || path.posix.isAbsolute(p)`), no `..` segment, none of `` ;&|`$()<> `` (backslashes allowed — Windows paths); throw `ApiError(400, …)` otherwise
   - `connectLocalRepo(userId, repositoryId, localPath)` → validate then existing `recordLocalRepoPath`
   - `listLocalRepoPaths(userId)` → `{repositoryId, localPath, updatedAt}[]`
   - `removeLocalRepoPath(userId, repositoryId)` → `ApiError(404, "Local repository not found")` if nothing deleted
   - Fix line 13: `fullname: repo.full_name`
3. `backend/src/modules/git/git.controller.js` — `connectLocalRepo` (400 if body fields missing), `getLocalRepos`, `disconnectLocalRepo` (param), `getAgentStatus` using `getAgentConnection` from `../../config/webScoket.config.js` → `{ connected: !!ws && ws.readyState === 1 }`
4. `backend/src/modules/git/git.routes.js` — `POST|GET /local-repo`, `DELETE /local-repo/:repositoryId`, `GET /agent-status`, all behind `verifyJwt`

**Verify:** Start backend; logged into the app in a browser, from the devtools console on :3000: `fetch('http://localhost:5000/api/git/v1/agent-status',{credentials:'include'}).then(r=>r.json())` → `{connected:false}`. POST/GET/DELETE `/local-repo` round-trips. POST with a relative path or `..` → 400.

> **Prompt:**
> ```
> Read frontend/docs/frontend-design.md fully, then implement Phase 0 (backend local-repo + agent-status endpoints) exactly as specified. Follow the existing module pattern in backend/src/modules — read git.routes.js, git.controller.js, repository.service.js and repository.repository.js before editing. Run the verification steps at the end.
> ```

---

## Phase 1 — Frontend foundation (API client, providers, auth gate)

**Install:** `pnpm add @tanstack/react-query zustand` (optionally `-D @tanstack/react-query-devtools`). Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5000`. Set backend `.env` `FRONTEND_URL=http://localhost:3000/dashboard` (post-OAuth landing).

**Files:**
- `src/lib/api-client.ts` — the foundation everything uses:
  - `class ApiClientError extends Error { status: number; payload?: unknown }`
  - `apiFetch<T>(path, init?)`: fetch `${API_URL}${path}` with `credentials:'include'` + JSON headers; on ok unwrap and return `body.data`; on 401 (unless path is the refresh endpoint or already retried) run a **single-flight** refresh (`POST /api/auth/v1/refresh-token`, module-scoped shared promise) then retry once; otherwise throw `ApiClientError`
  - Exported predicates: `isAgentOffline(e)` (409 + `/agent not connected/i`), `isRepoNotConnected(e)` (404 + `/local repository not found/i`), `isAgentTimeout(e)` (504), `isOperationInProgress(e)` (409, not the offline message)
  - No navigation/redirects inside `apiFetch` — the AuthGate owns that
- `src/lib/format-date.ts` — relative time via `Intl.RelativeTimeFormat` (no dependency)
- `src/app/(dashboard)/providers.tsx` (`'use client'`) — `QueryClientProvider` (QueryClient in `useState`; defaults `staleTime: 30_000`, mutations `retry: false`) + sonner `<Toaster />`. Scoped to the group; root layout stays untouched
- `src/features/auth/api/auth-api.ts` — `getMe`, `logout`, `logoutAll`, `getSessions`, `generateAgentToken` (data = raw token string), `revokeAgentToken`
- `src/features/auth/types/index.ts` — `User { _id, username, email, avatar, githubId }`, `Session { _id, type:'web'|'agent', deviceInfo, ip?, userAgent?, lastUsedAt, expiresAt, createdAt }`
- `src/features/auth/hooks/` — `use-me.ts` (key `['auth','me']`, `retry:false`, `staleTime` 5 min), `use-sessions.ts` (`['auth','sessions']`), `use-logout.ts` (logout/logoutAll mutations → `queryClient.clear()` + `router.replace('/login')`)
- `src/features/auth/components/auth-gate.tsx` (`'use client'`) — uses `useMe()`; loading → full-screen branded skeleton; error 401 → `router.replace('/login')`; success → children. **Client-side gate, deliberately not middleware.ts** (middleware can't verify the JWT and an expired 15-min access cookie would false-bounce users a silent refresh would have kept)
- `src/app/(dashboard)/layout.tsx` (RSC) — `<Providers><AuthGate>{children}</AuthGate></Providers>` (AppShell added in Phase 2)
- `src/app/(dashboard)/dashboard/page.tsx` — minimal placeholder

**Verify:** `pnpm dev` + backend running. Logged out, `/dashboard` bounces to `/login`. Complete GitHub OAuth → land authenticated. Delete the `accessToken` cookie in devtools, reload `/dashboard` → silent refresh keeps you in. Landing page and login page visuals unchanged.

> **Prompt:**
> ```
> Read frontend/docs/frontend-design.md fully, then implement Phase 1 (frontend foundation) exactly as specified. Phase 0 is already done. Look at frontend/src/features/auth/components/auth-card.tsx for the existing NEXT_PUBLIC_API_URL convention and frontend/src/components/ui/button.tsx for component style before writing code. Run the verification steps at the end.
> ```

---

## Phase 2 — Dashboard shell (sidebar, topbar, agent indicator)

**shadcn components:** `pnpm dlx shadcn@latest add avatar badge card dialog alert-dialog dropdown-menu input textarea label separator skeleton sonner tabs tooltip scroll-area sheet checkbox` — skip/keep the existing `button`. If `spinner`/`empty` don't exist in base-nova, use lucide `LoaderCircle` + `animate-spin` and an inline empty-state div instead.

**Files:**
- `src/components/layout/app-shell.tsx` (`'use client'`) — fixed left sidebar (w-60, `.glass`, `hidden lg:flex`) + topbar + scrollable main; mobile hamburger opens a `Sheet` with the same nav
- `src/components/layout/app-sidebar.tsx` — logo mark styled like `site-nav.tsx`; nav: Dashboard `/dashboard` (LayoutDashboard), Repositories `/repositories` (FolderGit2), Agent `/agent` (Cable), Settings `/settings` (Settings); active state via `usePathname()` → `bg-primary/10` + purple left indicator bar
- `src/components/layout/app-topbar.tsx` — page title slot, `<AgentStatusIndicator />`, avatar `DropdownMenu` (Settings, GitHub profile link, Logout wired to `use-logout`)
- `src/features/local-agent/api/local-agent-api.ts` — `getAgentStatus`, `getLocalRepos`, `connectLocalRepo({repositoryId, localPath})`, `disconnectLocalRepo(repositoryId)`
- `src/features/local-agent/hooks/use-agent-status.ts` — key `['agent','status']`, `refetchInterval: 15_000`, `retry: false`
- `src/features/local-agent/hooks/use-local-repos.ts` — key `['local-repos']`; connect/disconnect mutations invalidate `['local-repos']` + `['git','status', repositoryId]`
- `src/features/local-agent/components/agent-status-indicator.tsx` — green pulsing dot "Agent online" / muted dot "Agent offline" Badge, Tooltip explaining the agent, links to `/agent` when offline
- Wire `AppShell` into `(dashboard)/layout.tsx`; add placeholder pages: `src/app/(dashboard)/agent/page.tsx` (new folder), `/settings/page.tsx`, `/repositories/page.tsx`

**Verify:** Nav highlights the active route; mobile sheet works; start the agent with a token → indicator turns green within 15s; Logout returns to `/login` and `/dashboard` is gated again.

> **Prompt:**
> ```
> Read frontend/docs/frontend-design.md fully, then implement Phase 2 (dashboard shell) exactly as specified. Phases 0–1 are done — reuse src/lib/api-client.ts and the auth feature hooks. Match the visual language of the existing site (src/components/navigation/site-nav.tsx, globals.css utilities). Run the verification steps at the end.
> ```

---

## Phase 3 — Repositories list + create

**Files:**
- `src/features/repositories/types/index.ts` — `Repo { id:number; name; fullname?; description:string|null; visibility; defaultBranch; url; language:string|null; updatedAt }`, `Branch { name, sha }`, `GitCommandResult { exitCode:number; stdout:string; stderr:string }`
- `src/features/repositories/api/repositories-api.ts` — `getRepos`, `createRepo`, `getBranches(repoName)`, `createBranch(repoName, {branchName, baseBranch})`, `deleteGithubRepo`, `deleteGithubBranch` (call sites wrap deletes in try/catch — known server 500 risk — toast "GitHub deletion failed on the server" and refetch)
- `src/features/repositories/hooks/` — `use-repos.ts` (`['repos']`), `use-branches.ts` (`['repos', repoName, 'branches']`)
- `src/features/repositories/components/repo-card.tsx` — `.glass` card: name, description (line-clamp), visibility Badge, language dot, cyan "Connected" Badge when repo id is in `['local-repos']`, relative `updatedAt`; links to `/repositories/[name]`
- `src/features/repositories/components/create-repo-dialog.tsx` — name (required), description, private Checkbox, "Initialize with README" (`auto_init`) → mutation → invalidate `['repos']`, toast, navigate to detail
- `/repositories` page — header + "New repository" button, search Input (client-side filter), responsive grid of RepoCards; skeleton grid while loading, `Empty`-style CTA when none, error retry card

**Verify:** Real repos render (confirm `fullname` fallback to `name`); search filters; create repo → appears on GitHub and in the list.

> **Prompt:**
> ```
> Read frontend/docs/frontend-design.md fully, then implement Phase 3 (repositories list + create) exactly as specified. Phases 0–2 are done — reuse api-client, the shell, and the local-agent hooks for the "Connected" badge. Run the verification steps at the end.
> ```

---

## Phase 4 — Repo detail: git workspace panel + terminal (largest phase)

**Build the parser first:** `src/features/repositories/lib/parse-porcelain-status.ts` for `git status --porcelain=v2 -b` stdout:
- Headers: `# branch.oid <sha|(initial)>`, `# branch.head <name>` (may be `(detached)`), `# branch.upstream <name>`, `# branch.ab +A -B` → ints; ignore other `#` lines
- `1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>` — split first 8 fields on single spaces, remainder = path (may contain spaces). `X` = staged char, `Y` = unstaged char, `.` = none
- `2 <XY> …9 fixed fields… <path>\t<origPath>` — rename/copy; **TAB** separates paths (v2, not v1's `->`)
- `u <XY> …` → conflicted; `? <path>` → untracked; `! <path>` → skip
- Output: `GitStatus { branch: {oid, head, upstream?, ahead, behind}, entries: StatusEntry[] }`; `StatusEntry { path, origPath?, staged: Change|null, unstaged: Change|null, conflicted, untracked }`; `Change = 'modified'|'added'|'deleted'|'renamed'|'copied'|'typechange'|'unmerged'` from `MADRCTU`; helpers `hasStagedChanges`, `hasUnstagedChanges`, `isClean`
- Hand-test against real output from a local repo (mix staged/unstaged/untracked/renamed)

**Files:**
- `src/features/repositories/api/git-api.ts` — one fn per op posting `{ repositoryId: String(repo.id), … }`: `gitStatus`, `gitAdd(files?)`, `gitCommit(commitMessage)`, `gitPush({branch?, remote?})`, `gitPull`, `gitFetch`, `gitCreateBranch(branch)`, `gitSwitchBranch(branch)`, `gitDeleteBranch(branch, force)` (always sends `confirmed: true` — the UI dialog is the confirmation)
- `src/features/repositories/hooks/use-git-status.ts` — key `['git','status', id]`, `enabled` only when folder connected AND agent online, `retry: false`, `refetchOnWindowFocus: false`; parse stdout when `exitCode === 0`
- `src/features/repositories/hooks/use-git-mutation.ts` — shared factory: on settle append `{label, exitCode, stdout, stderr}` to terminal store; on `exitCode === 0` invalidate `['git','status', id]` (branch ops also invalidate `['repos', repoName, 'branches']`); `isAgentOffline` → refetch agent status + offline card; `isOperationInProgress` → toast; `isAgentTimeout` → toast
- `src/features/repositories/store/terminal-store.ts` (zustand, UI-only) — `Record<repositoryId, TerminalEntry[]>` (`{id, label, exitCode, stdout, stderr, at}`, cap 50), `append`, `clear`
- `src/features/local-agent/components/agent-offline-card.tsx` — `.glass` card, amber dot, "Local agent is offline", link to `/agent`
- `src/features/local-agent/components/connect-repo-dialog.tsx` — absolute-path Input with hint ("Absolute path, e.g. C:\Users\you\projects\my-repo"), client-side mirror of the Phase 0 validation, submit → connect mutation
- `src/features/repositories/components/git-workspace-panel.tsx` — state machine:
  1. No `['local-repos']` mapping → ConnectRepoCard (explains the agent runs commands in a folder on your machine) → connect dialog
  2. Mapping exists but agent offline → AgentOfflineCard
  3. Ready → **Changes** section: branch header (head, upstream, ↑ahead ↓behind badges) · file list with per-file Checkbox (staged pre-checked/visually distinct, conflicted rows destructive tint, untracked `U`, renamed `orig → new`) · clean-tree empty state · **commit flow**: select files or "All changes" → message Textarea → Commit = `gitAdd(selected || undefined)` then `gitCommit(message)` sequentially (two terminal entries) → then offer Push · toolbar: Refresh, Pull, Fetch, Push
  - **Branches** section (Tabs): Local — switch, create (dialog), delete via `AlertDialog` ("Delete branch ⟨x⟩? This cannot be undone." + "Force delete (-D)" Checkbox) sending `{branch, force, confirmed:true}` · GitHub — list `['repos', name, 'branches']`, create (branchName + baseBranch select), delete with graceful-failure toast
- `src/features/repositories/components/terminal-panel.tsx` — Card, `font-mono text-xs`, `ScrollArea` ~420px with autoscroll; per entry: label + timestamp + exit-code Badge (cyan tint for 0, destructive otherwise), stdout `whitespace-pre-wrap text-foreground/80`, stderr labelled in destructive tint; pending spinner row while a mutation runs; Clear button; empty state "Command output will appear here."
- `/repositories/[repoName]/page.tsx` — resolve repo from `useRepos()` by `decodeURIComponent(params.repoName)` (not-found state if absent); header (name, visibility, default branch, GitHub link); `lg:grid-cols-[1fr_380px]`: workspace panel left, terminal right

**Verify (agent running, real local clone):** connect absolute path → parsed status renders; edit a file → Refresh shows it; select → commit → push → commit visible on GitHub; create/switch branch; delete branch → confirm dialog → succeeds; kill the agent → offline card + red topbar dot; disconnect folder → connect card returns; commit on a clean tree → terminal shows non-zero exit badge + stderr.

> **Prompt:**
> ```
> Read frontend/docs/frontend-design.md fully, then implement Phase 4 (repo detail: git workspace panel + terminal) exactly as specified. Phases 0–3 are done. Build lib/parse-porcelain-status.ts first and hand-test it against real `git status --porcelain=v2 -b` output before building the UI. Run the full end-to-end verification at the end with the local agent running.
> ```

---

## Phase 5 — Agent page (`/agent`)

**Files** (all in `src/features/local-agent/components/`, composed by `src/app/(dashboard)/agent/page.tsx`):
- `agent-status-card.tsx` — big status dot, last-checked time, manual refresh button
- `agent-setup-steps.tsx` — numbered steps with copyable command blocks: 1) generate a token below, 2) `set GITEASE_AGENT_TOKEN=<token>` (Windows) / `export GITEASE_AGENT_TOKEN=<token>` (+ optional `GITEASE_BACKEND_URL=ws://localhost:5000`), 3) `node agent.js` from the `backend/agent` folder, 4) watch the indicator turn green
- `agent-token-section.tsx` — Generate → Dialog with read-only mono Input + copy button (`navigator.clipboard`) + amber warning "This token will not be shown again"; Revoke → AlertDialog noting the running agent will disconnect
- Connected folders list — from `['local-repos']`, repo name resolved via `['repos']`, path in mono, disconnect button per row

**Verify:** Generate token, close dialog → unrecoverable; use it to start the agent → indicator green; revoke → agent drops (next git command shows offline) and the agent session disappears from Settings.

> **Prompt:**
> ```
> Read frontend/docs/frontend-design.md fully, then implement Phase 5 (agent page) exactly as specified. Phases 0–4 are done — reuse the local-agent feature slice and auth-api token functions. Run the verification steps at the end.
> ```

---

## Phase 6 — Settings + dashboard home

**Files:**
- `src/features/auth/components/profile-card.tsx` — Avatar, username, email, githubId (read-only, from `['auth','me']`)
- `src/features/auth/components/sessions-list.tsx` — Card rows: type Badge (web/agent, distinct colors), deviceInfo, ip, truncated userAgent + Tooltip, relative `lastUsedAt`/`expiresAt`; skeleton + empty states
- `src/features/auth/components/danger-zone.tsx` — "Log out" (mutation → `/login`); "Log out all devices" behind AlertDialog ("This ends every web session and disconnects your agent")
- `/settings/page.tsx` — ProfileCard → SessionsList → agent-token card (link to `/agent` + revoke) → DangerZone
- `src/app/(dashboard)/dashboard/_components/dashboard-home.tsx` — greeting (`.text-gradient` username) → stat Card row (repo count from `['repos']`, connected folders from `['local-repos']`, agent status, active sessions) → recent 5 repos by `updatedAt` (rows link to detail) → quick actions (New repository, Set up agent); skeletons + inline retry
- `/dashboard/page.tsx` — replace placeholder with DashboardHome

**Verify:** Profile matches GitHub; web + agent sessions listed; logout-all kills a second browser's session and the agent.

> **Prompt:**
> ```
> Read frontend/docs/frontend-design.md fully, then implement Phase 6 (settings + dashboard home) exactly as specified. Phases 0–5 are done — this phase is pure composition of existing hooks; add no new API functions. Run the verification steps at the end.
> ```

---

## Phase 7 — Polish & QA

- Loading skeletons, empty states, and error states reviewed on every page
- All mutations have success/error toasts
- `pnpm build` passes **and** `pnpm exec tsc --noEmit` passes (next.config.mjs has `ignoreBuildErrors: true`, so tsc is the real bar)
- Landing page and login page are pixel-untouched (`src/app/(public)/**`, `workspace-dashboard.tsx`)
- Responsive pass: sidebar Sheet on mobile, repo grid collapses, repo detail stacks to one column

> **Prompt:**

> ```
> Read frontend/docs/frontend-design.md fully, then do Phase 7 (polish & QA). Phases 0–6 are done. Audit every dashboard page for loading/empty/error states and toasts, run `pnpm build` and `pnpm exec tsc --noEmit` in frontend/ and fix all errors, and verify the public marketing site and login page are unchanged.
> ```
