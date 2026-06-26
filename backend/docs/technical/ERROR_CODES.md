# GitEase Error Codes Specification

**Document Version:** v0.1

**Status:** Draft

**Owner:** Soham Ghadge

**Last Updated:** TBD

---

# 1. Purpose

This document defines the standardized error codes used throughout the GitEase backend.

The purpose of these codes is to provide a stable contract between the backend and frontend. While error messages may change over time for clarity or localization, the error codes remain stable and should be used by clients to determine application behavior.

Every API error response must reference one of the error codes defined in this document.

---

# 2. Error Response Format

All API errors follow the same structure.

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Access token is invalid."
  }
}
```

## Rules

* `success` is always `false`.
* `code` is machine-readable and must remain stable.
* `message` is human-readable and may change.
* HTTP status codes must align with the error category.

---

# 3. Naming Convention

Error codes follow the format:

```text
<MODULE>_<NUMBER>
```

Examples:

```text
AUTH_001
USER_001
REPO_001
WORKSPACE_001
```

Numbers should never be reused once published.

---

# 4. Authentication Errors

| Code     | HTTP | Name                         | Description                           | Frontend Action        |
| -------- | ---- | ---------------------------- | ------------------------------------- | ---------------------- |
| AUTH_001 | 401  | INVALID_ACCESS_TOKEN         | Access token is invalid or malformed. | Attempt refresh.       |
| AUTH_002 | 401  | ACCESS_TOKEN_EXPIRED         | Access token has expired.             | Call refresh endpoint. |
| AUTH_003 | 401  | INVALID_REFRESH_TOKEN        | Refresh token is invalid.             | Redirect to login.     |
| AUTH_004 | 401  | REFRESH_TOKEN_EXPIRED        | Refresh token has expired.            | Redirect to login.     |
| AUTH_005 | 401  | SESSION_REVOKED              | Session has been revoked.             | Redirect to login.     |
| AUTH_006 | 401  | SESSION_NOT_FOUND            | Session does not exist.               | Redirect to login.     |
| AUTH_007 | 401  | AUTHENTICATION_REQUIRED      | Authentication required.              | Redirect to login.     |
| AUTH_008 | 403  | GITHUB_AUTHENTICATION_FAILED | GitHub OAuth authentication failed.   | Retry authentication.  |
| AUTH_009 | 403  | INSUFFICIENT_PERMISSIONS     | User lacks required permissions.      | Show permission error. |

---

# 5. User Errors

| Code     | HTTP | Name                | Description                    | Frontend Action      |
| -------- | ---- | ------------------- | ------------------------------ | -------------------- |
| USER_001 | 404  | USER_NOT_FOUND      | Requested user does not exist. | Display error.       |
| USER_002 | 409  | USER_ALREADY_EXISTS | User already exists.           | Continue login flow. |
| USER_003 | 400  | INVALID_USER_DATA   | Invalid user data supplied.    | Correct request.     |

---

# 6. Validation Errors

| Code           | HTTP | Name                   | Description                |
| -------------- | ---- | ---------------------- | -------------------------- |
| VALIDATION_001 | 400  | INVALID_REQUEST        | Request validation failed. |
| VALIDATION_002 | 400  | REQUIRED_FIELD_MISSING | Required field missing.    |
| VALIDATION_003 | 422  | INVALID_FORMAT         | Field format invalid.      |

---

# 7. System Errors

| Code       | HTTP | Name                  | Description                      |
| ---------- | ---- | --------------------- | -------------------------------- |
| SYSTEM_001 | 500  | INTERNAL_SERVER_ERROR | Unexpected server error.         |
| SYSTEM_002 | 503  | SERVICE_UNAVAILABLE   | Service temporarily unavailable. |
| SYSTEM_003 | 500  | DATABASE_ERROR        | Database operation failed.       |
| SYSTEM_004 | 504  | REQUEST_TIMEOUT       | Request timed out.               |

---

# 8. Future Modules

Reserved prefixes:

```text
REPO_XXX

BRANCH_XXX

COMMIT_XXX

PR_XXX

WORKSPACE_XXX

SETTINGS_XXX

NOTIFICATION_XXX

AGENT_XXX
```

These modules will define their own error codes as new features are implemented.

---

# 9. Engineering Guidelines

* Never return plain text errors.
* Every error must have:

  * HTTP status code
  * Stable error code
  * Human-readable message
* Frontend logic should rely on `error.code`, not `message`.
* Log detailed internal errors on the server but return safe messages to clients.
* Do not expose stack traces or sensitive implementation details in API responses.

---

# 10. Traceability

| Module                | Related Document      |
| --------------------- | --------------------- |
| Authentication        | AUTHENTICATION_FDD.md |
| Authentication APIs   | API_SPEC.md           |
| User & Session Models | DATABASE.md           |

Each error code should map back to a documented business rule or technical requirement.

---

# 11. Revision History

| Version | Description                                                          |
| ------- | -------------------------------------------------------------------- |
| v0.1    | Initial error code specification for Authentication and User modules |
