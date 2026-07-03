# GitEase API Specification

**Document Version:** v0.2

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

# 12. HTTP Status Codes

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

# 13. API Naming Standards

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

# 14. Security Considerations

Access Tokens should never be stored in Local Storage.

Refresh Tokens must remain inside HttpOnly Secure Cookies.

Sensitive endpoints require authentication middleware.

Future versions will support:

Refresh Token Rotation

CSRF Protection

Rate Limiting

Device Fingerprinting

---

# 15. Future Endpoints

Commits

Pull Requests

Workspace

Organizations

Notifications

Settings

Analytics

These endpoints will be documented as corresponding features are implemented.

---

# 16. Revision History

| Version | Description |
|----------|-------------|
| v0.1 | Initial Authentication API Specification |
| v0.2 | Added Repository and Branch API endpoints (list/create repositories, create/list branches) |