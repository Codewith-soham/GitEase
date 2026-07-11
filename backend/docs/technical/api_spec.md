# GitEase API Specification

**Document Version:** v0.4

**Status:** Draft

**Owner:** Soham Ghadge

**Last Updated:** TBD

---

# 1. Purpose

This document defines the API contract between the GitEase frontend and backend.

Its primary purpose is to provide a consistent, predictable, and versioned interface for communication between clients and the backend services.

This document describes API behavior rather than implementation details.

---

# 2. Design Philosophy

The GitEase API follows RESTful principles.

Every endpoint should be:

- Predictable
- Consistent
- Versioned
- Secure
- Resource-oriented
- Easy to extend without breaking existing clients

The API contract is considered the source of truth for communication between frontend and backend.

---

# 3. API Versioning

All endpoints are versioned.

Current Version

/api/v1

Future breaking changes will introduce:

/api/v2

without affecting existing clients.

---

# 4. Base URL

Development

http://localhost:5000/api/v1

Production

(To be added)

---

# 5. Authentication

GitEase uses JWT-based authentication.

Authentication consists of:

- Short-lived Access Token
- Long-lived Refresh Token

Access Tokens authorize protected API requests.

Refresh Tokens generate new Access Tokens without requiring the user to authenticate again.

---

# 6. Authentication Flow

GitHub OAuth

↓

GitEase Backend

↓

Create User (if needed)

↓

Create Session

↓

Generate Access Token

↓

Generate Refresh Token

↓

Return authenticated session

---

# 7. Token Strategy

## Access Token

Purpose

Authenticate API requests.

Lifetime

Short-lived.

Storage

Frontend memory.

Sent Through

Authorization Header.

---

## Refresh Token

Purpose

Generate new Access Tokens.

Lifetime

Long-lived.

Storage

HttpOnly Secure Cookie.

Sent Automatically

By browser.

---

# 8. Standard Request Headers

Protected APIs require:

Authorization: Bearer <access_token>

Content-Type: application/json

Accept: application/json

---

# 9. Standard Response Format

Every endpoint must follow the same response structure.

## Success

{
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
}

---

## Failure

{
    "success": false,
    "error": {
        "code": "AUTH_001",
        "message": "Invalid access token."
    }
}

---

# 10. Authentication Endpoints

---

## 10.1 GitHub Login

POST /api/v1/auth/github

Purpose

Authenticate users using GitHub OAuth.

Business Rule

BR-001

Authentication FDD Reference

US-001

Authentication Required

No

Request

GitHub authorization code.

Response

User information

Access Token

Refresh Token Cookie

Possible Errors

AUTH_001

AUTH_005

---

## 10.2 Refresh Access Token

POST /api/v1/auth/refresh

Purpose

Generate a new Access Token using a valid Refresh Token.

Business Rule

BR-005

Authentication Required

Refresh Token Cookie

Request

No request body.

Refresh Token automatically sent through HttpOnly cookie.

Response

New Access Token

Possible Errors

AUTH_002

AUTH_003

AUTH_004

Frontend Action

Retry original request after successful refresh.

Redirect to Login if refresh fails.

---

## 10.3 Logout

POST /api/v1/auth/logout

Purpose

Invalidate current authenticated session.

Business Rule

BR-007

Authentication Required

Yes

Request

No request body.

Response

Success message.

Cookie cleared.

Session revoked.

Possible Errors

AUTH_003

AUTH_006

Frontend Action

Clear local authentication state.

Redirect to Login.

---

## 10.4 Logout All Devices

POST /api/v1/auth/logout-all

Purpose

Invalidate every active session owned by the authenticated user.

Business Rule

BR-008

Authentication Required

Yes

Request

No request body.

Response

Success message.

All sessions revoked.

Possible Errors

AUTH_006

Frontend Action

Clear authentication state on current device.

Require login on every device.

---

## 10.5 Current User

GET /api/v1/users/me

Purpose

Return currently authenticated user's profile.

Business Rule

BR-009

Authentication Required

Yes

Request

None

Response

Authenticated User

Possible Errors

AUTH_001

USER_001

---

## 10.6 Generate Agent Token

POST /api/auth/v1/agent-token

Purpose

Issue a long-lived token used by the local GitEase Agent to authenticate its WebSocket connection to the backend.

Authentication Required

Yes

Request

No request body.

Response

The raw agent token (string). It is hashed before storage and cannot be retrieved again after this response.

Possible Errors

AUTH_007

SYSTEM_001

Frontend Action

Display the token once so the user can copy it into their local agent's environment.

---

## 10.7 Revoke Agent Token

DELETE /api/auth/v1/agent-token

Purpose

Revoke all active agent tokens (sessions of type `agent`) belonging to the authenticated user.

Authentication Required

Yes

Request

No request body.

Response

Success message.

Possible Errors

AUTH_007

SYSTEM_001

Frontend Action

Disconnect any active local agent connection state shown in the UI.

---

# 11. Repository Endpoints

Repository endpoints proxy GitHub's REST API on behalf of the authenticated user, using the GitHub access token stored on their account.

---

## 11.1 List Repositories

GET /api/repository/v1/repo

Purpose

Fetch all GitHub repositories accessible to the authenticated user's linked GitHub account.

Authentication Required

Yes

Request

None

Response

Array of repositories, each containing:

id, name, fullname, description, visibility, defaultBranch, url, language, updatedAt

Possible Errors

AUTH_007

SYSTEM_001

---

## 11.2 Create Repository

POST /api/repository/v1/repo

Purpose

Create a new repository on the authenticated user's GitHub account.

Authentication Required

Yes

Request

name

private

description

auto_init

Response

id, name, private, description, url, updatedAt

Possible Errors

AUTH_007

VALIDATION_001

SYSTEM_001

---

## 11.3 Create Branch

POST /api/repository/v1/repo/:repoName/branches

Purpose

Create a new branch in the specified repository, starting from the tip of an existing base branch.

Authentication Required

Yes

Path Parameters

repoName

Request

branchName

baseBranch

Response

name, sha

Possible Errors

AUTH_007

VALIDATION_001

404 if the base branch does not exist

SYSTEM_001

---

## 11.4 List Branches

GET /api/repository/v1/repo/:repoName/branches

Purpose

Return all branches for the specified repository.

Authentication Required

Yes

Path Parameters

repoName

Request

None

Response

Array of branches, each containing:

name, sha

Possible Errors

AUTH_007

404 if the repository does not exist

SYSTEM_001

---

# 12. Automation Endpoints

Automation endpoints drive the local GitEase Agent over WebSocket to run Git commands against a local working directory on the user's machine. The backend never executes Git commands directly — it forwards commands to the connected agent and streams back the result.

---

## 12.1 Push Changes

POST /api/automation/v1/push

Purpose

Run an automated add → commit → push workflow against a local repository via the connected local agent.

Authentication Required

Yes

Request

cwd

branch

commitMessage (optional, defaults to "automated commit")

Response

Array of step results, each containing:

step, exitCode, stdout, stderr

One entry per workflow step that ran (`init`, `add`, `commit`, `push`). The array stops early if a step fails, except a `commit` step with nothing to commit, which is treated as non-fatal and followed by `push`.

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_005

VALIDATION_001

Frontend Action

Render each step's stdout/stderr like a live terminal.

Surface AGENT_005 as "a push is already running" rather than a generic error.

---

# 13. Git Command Endpoints

Git command endpoints drive individual Git commands against a local working directory via the connected local agent. Unlike the Automation push workflow, each endpoint here maps to a single Git command. The backend never executes Git commands directly — it resolves `repositoryId` to a trusted local path (never trusting a client-supplied `cwd`), forwards the command to the connected agent, and returns the result.

All request bodies below also require `repositoryId`, used to resolve the local working directory. All responses share the same shape: `exitCode`, `stdout`, `stderr`, wrapped in the standard success envelope (`{ success, message, data }`).

---

## 13.1 Status

POST /api/git/v1/status

Purpose

Run `git status` against the resolved local repository.

Authentication Required

Yes

Request

repositoryId

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.2 Add

POST /api/git/v1/add

Purpose

Stage files in the resolved local repository.

Authentication Required

Yes

Request

repositoryId

files (optional array of file paths; stages all changes if omitted)

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.3 Commit

POST /api/git/v1/commit

Purpose

Commit staged changes in the resolved local repository.

Authentication Required

Yes

Request

repositoryId

commitMessage

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.4 Push

POST /api/git/v1/push

Purpose

Push local commits to a remote branch.

Authentication Required

Yes

Request

repositoryId

branch (optional)

remote (optional, defaults to `origin`)

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.5 Pull

POST /api/git/v1/pull

Purpose

Pull changes from a remote branch into the resolved local repository.

Authentication Required

Yes

Request

repositoryId

branch (optional)

remote (optional, defaults to `origin`)

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.6 Fetch

POST /api/git/v1/fetch

Purpose

Fetch refs from a remote without merging.

Authentication Required

Yes

Request

repositoryId

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.7 Create Branch

POST /api/git/v1/create-branch

Purpose

Create and switch to a new branch in the resolved local repository.

Authentication Required

Yes

Request

repositoryId

branch

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.8 Switch Branch

POST /api/git/v1/switch-branch

Purpose

Switch to an existing branch in the resolved local repository.

Authentication Required

Yes

Request

repositoryId

branch

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

---

## 13.9 Delete Branch

POST /api/git/v1/delete-branch

Purpose

Delete a branch in the resolved local repository. Destructive — requires explicit client confirmation.

Authentication Required

Yes

Request

repositoryId

branch

force (optional, uses `-D` instead of `-d` when true)

confirmed (must be `true`, or the request is rejected before any agent command runs)

Response

exitCode, stdout, stderr

Possible Errors

AUTH_007

AGENT_001

AGENT_002

AGENT_003

AGENT_006

AGENT_007

VALIDATION_001

404 if no local repository mapping exists for repositoryId

SYSTEM_001

Frontend Action

Require the user to explicitly confirm the deletion in the UI before sending `confirmed:true`.

Surface AGENT_007 as "confirmation required" rather than a generic error.

---

# 14. HTTP Status Codes

200 OK

Successful request.

201 Created

Resource successfully created.

204 No Content

Operation completed without response body.

400 Bad Request

Invalid client request.

401 Unauthorized

Authentication failed.

403 Forbidden

Authenticated but not allowed.

404 Not Found

Requested resource not found.

409 Conflict

Resource conflict.

422 Unprocessable Entity

Validation failure.

429 Too Many Requests

Rate limit exceeded.

500 Internal Server Error

Unexpected server error.

---

# 15. API Naming Standards

Resources

Plural nouns.

/users

/repositories

/workspaces

HTTP Methods

GET

Read

POST

Create

PATCH

Partial Update

PUT

Replace

DELETE

Delete

Route Naming

Use kebab-case.

Example

/logout-all

Never

/logoutAll

---

# 16. Security Considerations

Access Tokens should never be stored in Local Storage.

Refresh Tokens must remain inside HttpOnly Secure Cookies.

Sensitive endpoints require authentication middleware.

Future versions will support:

Refresh Token Rotation

CSRF Protection

Rate Limiting

Device Fingerprinting

---

# 17. Future Endpoints

Commits

Pull Requests

Workspace

Organizations

Notifications

Settings

Analytics

These endpoints will be documented as corresponding features are implemented.

---

# 18. Revision History

| Version | Description |
|----------|-------------|
| v0.1 | Initial Authentication API Specification |
| v0.2 | Added Repository and Branch API endpoints (list/create repositories, create/list branches) |
| v0.3 | Added agent-token endpoints and the Automation push workflow endpoint |
| v0.4 | Added the nine Git Command endpoints (status, add, commit, push, pull, fetch, create-branch, switch-branch, delete-branch) and AGENT_006–AGENT_007 error codes |