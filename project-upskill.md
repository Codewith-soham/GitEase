# GitEase — Improvement & Upskill Areas

Compiled from a full read-only audit of the frontend (Next.js 16/React 19)
and backend (Express/MongoDB + local agent). Items are grouped by severity.
File paths are relative to the repo root unless noted.

## 🔴 Security-critical

1. **Plaintext GitHub access tokens stored in DB.**
   `backend/src/models/user.model.js:29` stores `githubAccessToken`
   (scoped to `repo, delete_repo`) as a raw required `String`, unencrypted.
   A DB compromise gives full repo/account control for every user.
   → Encrypt at rest (e.g. libsodium/KMS-backed field encryption) before
   persisting.

2. **Weak/placeholder JWT secrets, no strength validation.**
   `backend/src/config/env.config.js` validates that `JWT_ACCESS_TOKEN`,
   `JWT_REFRESH_TOKEN`, `AGENT_JWT_SECRET` etc. are *present* via `envalid`,
   but never checks length/entropy — a one-character secret would pass.
   → Add a custom envalid validator enforcing a minimum length (e.g. 32+
   chars) for all secret env vars.

## 🟠 Major gaps

3. **No automated tests anywhere that actually pass.**
   - Frontend: zero test infrastructure (no Jest/Vitest/Playwright/Cypress
     config, no `*.test.*`/`*.spec.*` files at all).
   - Backend: one test file, `backend/src/tests/auth.test.js`, and it's
     currently broken — 9 of 20 tests fail because mocks (`User.findById`
     returning `{ select: async () => {...} }`) don't match the real
     implementation (`auth.middleware.js:19` calls `findById` with no
     `.select()`). `npm test` fails as-is.
   - No coverage at all for `git`, `repository`, `automation` modules, the
     WebSocket layer, or agent command dispatch — the highest-risk code in
     the app.
   → Fix the broken auth tests first, then add unit tests for
   `src/lib/api-client.ts` and `parse-porcelain-status.ts` (frontend) and
   `agent.services.js` / `commonValidator.js` (backend) as a starting set.

4. **No CI/CD pipeline anywhere.**
   No `.github/workflows` in the repo at all — nothing runs lint, tests, or
   type-checks on push/PR. Combined with #3, broken tests can merge
   unnoticed indefinitely.
   → Add a GitHub Actions workflow that runs `npm run build`, `npm run
   lint`, and `npm test` for both `frontend/` and `backend/` on every PR.

5. **No linting configured on either side.**
   - Frontend: `package.json` has a `"lint": "eslint ."` script but there is
     no `.eslintrc*`/`eslint.config.*` file anywhere — it currently has
     nothing to run against.
   - Backend: no linter at all (only Prettier formatting is enforced via
     `.prettierrc`).
   → Add `eslint.config.mjs` (flat config) to `frontend/`, and a baseline
   ESLint config to `backend/`.

6. **`typescript.ignoreBuildErrors: true` in `frontend/next.config.mjs`.**
   This silently lets type errors ship to production despite
   `tsconfig.json` having `"strict": true` — the strict config provides no
   actual safety net at build time.
   → Remove the flag once existing type errors (if any) are cleaned up.

## 🟡 Nice to have — Security & correctness

7. **No request/response schema validation despite `zod` being installed**
   (backend `package.json` lists it, README says "Zod for validation," but
   `grep -rn "zod"` across `backend/src` returns zero real usage). Route
   handlers pass `req.body` through with only ad-hoc null checks.
   → Add zod schemas at the controller boundary for `repository`, `git`,
   and `automation` routes so malformed input gets a clean 400 instead of
   surfacing as an opaque agent error.

8. **No CSRF protection on cookie-authenticated state-changing routes**
   (`/logout`, `/logoutall`, `/agent-token`, repo delete). Cookies use
   `sameSite: 'none'` in production (`auth.controller.js:8-11`).
   → Add an `Origin`/`Referer` check or CSRF token for state-changing
   requests.

9. **GitHub OAuth flow has no `state` parameter**
   (`backend/src/modules/auth/auth.controller.js:16-18`), so the callback
   can't verify the request originated from this app.
   → Generate and validate a `state` param through the OAuth handshake.

10. **Centralized error middleware leaks internal error messages.**
    `backend/src/middleware/error.middleware.js:4-8` returns `err.message`
    verbatim for *any* thrown error, not just intentional `ApiError`s — a
    raw Mongoose/DB error message can reach the client.
    → Fall back to a generic message for non-`ApiError` exceptions in
    production; keep full detail only in the server-side log.

11. **WebSocket connection map key-type bug.**
    `backend/src/config/webScoket.config.js:42` stores connections keyed by
    `String(userId)`, but the cleanup on close at line 51 deletes by raw
    `userId` (no `String()`), so if `userId` isn't already a string the
    delete is a no-op and the map leaks a stale entry.
    → Make the key coercion consistent between set and delete.

12. **No cleanup of in-flight agent requests on WebSocket disconnect.**
    `backend/src/services/agent.services.js`'s `pendingRequests` map isn't
    cleared when the agent's socket closes — callers wait out the full
    timeout (default 60s) instead of failing fast.
    → Reject all pending requests for a connection immediately on its
    `close`/`error` event.

13. **`crypto` listed as an npm dependency** (`backend/package.json`,
    `^1.0.1`) — this is a deprecated legacy stub that shadows Node's
    built-in `crypto` module, which the code already relies on via
    `import crypto from 'crypto'`.
    → Remove the dependency; it does nothing but add noise/risk.

14. **`shadcn` CLI package listed under `dependencies` instead of
    `devDependencies`** in `frontend/package.json` — it's a codegen tool,
    not a runtime dependency.
    → Move to `devDependencies`.

15. **Verify `lucide-react` version pin.** `frontend/package.json` pins
    `^1.16.0`, which is unusual — published `lucide-react` releases are in
    the 0.x series. Worth confirming this resolves to the intended
    package/version.

## 🟡 Nice to have — Performance

16. **`ScrollStory` (the section right after Hero) uses the same
    JS-gated `opacity:0` GSAP pattern** that caused the 17s LCP bug we just
    fixed (`frontend/src/app/(public)/_components/scroll-story.tsx:35-59,
    93-96`). It's below the fold so it doesn't hurt LCP directly, but it can
    cause a visible flash/CLS on first scroll if GSAP hasn't loaded yet.
    → Consider the same fix pattern (CSS-only or scroll-triggered reveal
    that doesn't start from a hard `opacity:0` before JS is ready).

17. **`images: { unoptimized: true }` in `frontend/next.config.mjs`** with
    zero `next/image`/`<img>` usage found anywhere today — not a live
    problem, but this setting will silently defeat image optimization the
    moment anyone adds a raster image (e.g. user avatars, screenshots).
    → Revisit once real images are introduced; enable Next's image
    pipeline then.

18. **`git-workspace-panel.tsx` is 688 lines** — a major outlier versus
    every other component in the app (next largest ~200 lines).
    (`frontend/src/features/repositories/components/git-workspace-panel.tsx`)
    → Split into smaller components/hooks to reduce re-render scope and
    improve readability.

19. **No `next/font` issues, no render-blocking scripts** — confirmed
    clean during the earlier LCP investigation; no action needed here,
    noted for completeness.

## 🟢 Nice to have — Quality of life / polish

20. **No accessible labels on icon-only buttons** in several places
    (confirmed offenders): `connected-folders-list.tsx:~55`,
    `git-workspace-panel.tsx:~669`, `docs/command-block.tsx:~15`,
    `local-agent/components/agent-token-section.tsx:~169` (copy button).
    `app-topbar.tsx` already does this correctly (`aria-label="Open
    navigation"`, etc.) — use it as the template.

21. **No SEO essentials**: no `sitemap.xml`/`robots.txt`, no Open Graph or
    Twitter card metadata, no structured data (JSON-LD), and only the root
    layout defines `metadata` (child routes share the same title/
    description in link previews).
    → Add `app/sitemap.ts`, `app/robots.ts`, and `openGraph`/`twitter`
    fields to the root and key public-page metadata.

22. **No error boundaries or custom error/loading pages.** No
    `error.tsx`, `global-error.tsx`, `not-found.tsx`, or route-level
    `loading.tsx` anywhere in `frontend/src/app`. An unexpected render
    exception in the dashboard currently has nothing to catch it.
    → Add at least a root `error.tsx` and `not-found.tsx`.

23. **No error/crash tracking (e.g. Sentry) anywhere.** Combined with #22,
    a production client-side exception is currently invisible — no logging
    path at all. Vercel Analytics + Clarity are in place, but neither
    reports JS errors.
    → Add Sentry (or similar) for both frontend and backend.

24. **Backend logging is 34 raw `console.log`/`console.error` calls**, no
    structured logger (winston/pino), no log levels, no request
    correlation IDs. `morgan` covers HTTP access logs only.
    → Introduce a structured logger for application-level logs.

25. **No `/health` endpoint on the backend** for uptime monitoring/load
    balancer probes — only the four `/api/*` route groups are mounted.

26. **Minor backend code cleanliness**: a duplicated route registration
    in `repository.route.js:9-10`; a stray `console.log("req.user:", ...)`
    debug line in `repository.controller.js:12`; a misleading/unused JWT
    payload field in `tokenGenration.js` (`generateRefreshToken` signs
    `{ sessionId }` but every caller actually passes the user id, and
    `refreshAccessToken` never reads the payload at all).

27. **Several `features/*` directories are empty scaffolding**
    (`activity`, `onboarding`, `workspace` stores/APIs contain only
    `.gitkeep`) — fine as placeholders, but worth a comment or tracking
    issue so it's clear what's planned vs. abandoned.

## ✅ Things already done well (keep doing these)

- Command-injection defenses on the git-proxy path are strong:
  `agent/gitExecutor.js` uses `spawn` with array args (no shell), and
  `agent/commonValidator.js` whitelists commands and rejects shell
  metacharacters/path traversal.
- `src/lib/api-client.ts` (frontend) has solid typed error handling,
  single-flight 401 refresh-and-retry, and semantic error predicates.
- Helmet, CORS, and two-tier rate limiting are correctly configured in
  `backend/src/app.js`.
- Env var validation at startup via `envalid` (`backend/src/config/
  env.config.js`), imported before anything else runs.
- Feature-sliced frontend architecture (`features/<name>/{api,components,
  hooks,store,types}`) is consistently applied where implemented.
- Backend README and `docs/technical/*.md` are genuinely useful onboarding
  material.
