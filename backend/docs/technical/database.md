# GitEase Database Design

**Document Version:** v0.1

**Status:** Draft

**Owner:** Soham Ghadge

**Last Updated:** TBD

---

# 1. Purpose

This document describes the database design for GitEase Version 1.

Its purpose is to explain:

* Why each collection exists.
* The responsibility of each collection.
* Relationships between collections.
* Design decisions.
* Indexing strategy.
* Data lifecycle.
* Future scalability considerations.

This document focuses on **database design** rather than implementation.

---

# 2. Database Overview

GitEase currently uses **MongoDB** as its primary database.

MongoDB was selected because it aligns well with the MERN stack and provides flexibility for an evolving product where new features and fields may be introduced frequently during the startup phase.

Current Collections:

* User
* Session

Future collections (planned):

* RepositoryMetadata
* Workspace
* Organization
* ActivityLog
* Notification
* UserSettings

GitHub remains the source of truth for repository data. GitEase stores only application-specific information.

---

# 3. Design Principles

The database follows these principles:

* GitHub owns repository data.
* GitEase stores only application-specific metadata.
* Collections should have a single responsibility.
* Authentication data is isolated from user profile data.
* Future scalability should not require major schema redesign.
* Sensitive information should never be stored in plain text when avoidable.

---

# 4. Entity Relationship

```text
User (1)
    │
    │
    ├───────────────┐
    │               │
    ▼               ▼

Session (Many)

One User
↓

Many Active Sessions

Each Session
↓

One Refresh Token
```

A single user may authenticate from multiple devices or browsers.

Each authenticated login creates a separate Session document.

---

# 5. User Collection

## Purpose

The User collection represents a GitEase account linked to a GitHub account.

Rather than creating a separate identity system with usernames and passwords, GitEase relies on GitHub OAuth and stores only the information required by the application.

This collection acts as the application's representation of an authenticated GitHub user.

---

## Collection Fields

### githubId

Type

String

Purpose

Unique identifier returned by GitHub.

Reason

GitHub IDs never change, unlike usernames.

Business Importance

Primary identity for authentication.

Constraints

* Required
* Unique
* Indexed
* Lowercase

---

### username

Type

String

Purpose

GitHub username.

Reason

Used for displaying user information inside GitEase.

Constraints

* Unique
* Indexed
* Lowercase

Note:

Usernames can change on GitHub. Authentication always relies on githubId rather than username.

---

### email

Type

String

Purpose

Primary email associated with the GitHub account.

Reason

Used for future notifications, workspace invitations, and communication.

Constraints

* Lowercase
* Sparse Index

Why Sparse?

GitHub users may choose not to expose a public email address.

A sparse index allows multiple documents without an email while still preventing duplicate indexed values when an email is present.

---

### avatar

Type

String

Purpose

Stores the GitHub profile image URL.

Reason

Used for displaying profile information throughout the application.

---

### githubAccessToken

Type

String

Purpose

Stores the GitHub OAuth Access Token.

Reason

Required for GitEase to communicate with GitHub APIs on behalf of the authenticated user.

Future Note

In future versions, encryption at rest should be considered for this field because it grants delegated access to GitHub resources.

---

### createdAt / updatedAt

Automatically maintained by Mongoose.

Purpose

Audit information.

Used for tracking account creation and profile updates.

---

# 6. Session Collection

## Purpose

The Session collection manages authenticated GitEase sessions.

A session represents one authenticated login from one device/browser.

Sessions allow GitEase to:

* Refresh Access Tokens.
* Support logout.
* Support logout from all devices.
* Track active devices.
* Prepare for future session management features.

Without this collection, JWT authentication would be completely stateless, making session revocation impossible.

---

## Collection Fields

### userId

Type

ObjectId

Reference

User

Purpose

Links the session to its owner.

Reason

One User may own multiple active sessions.

---

### refreshToken

Type

String

Purpose

Stores the hashed Refresh Token.

Reason

Refresh Tokens should never be stored in plain text.

If the database were compromised, attackers should not be able to reuse stolen refresh tokens.

Current Implementation

Uses SHA-256 hashing before persistence through the `hashToken()` static method.

Reason for SHA-256

Unlike passwords, refresh tokens are already high-entropy random values.

A fast cryptographic hash is appropriate and avoids the computational cost of password hashing algorithms like bcrypt.

---

### deviceInfo

Type

String

Purpose

Human-readable device identifier.

Examples

* Chrome on Windows
* Safari on macOS
* Firefox on Linux

Reason

Future versions of GitEase will expose active device sessions to users.

---

### ip

Type

String

Purpose

Stores the IP address used when creating the session.

Reason

Supports future security features including suspicious login detection and security audit logs.

---

### userAgent

Type

String

Purpose

Stores the browser's user-agent string.

Reason

Improves device identification and troubleshooting.

---

### lastUsedAt

Type

Date

Purpose

Tracks the last successful use of the session.

Reason

Future session cleanup, analytics, and security monitoring.

Automatically updated whenever the session is successfully refreshed.

---

### expiresAt

Type

Date

Purpose

Defines the expiration time of the session.

Reason

MongoDB TTL automatically deletes expired sessions.

Current Implementation

TTL Index

```javascript
expiresAfterSeconds: 0
```

Why?

MongoDB automatically removes expired session documents.

This eliminates manual cleanup jobs and reduces maintenance overhead.

---

### createdAt / updatedAt

Automatically managed by Mongoose.

Purpose

Audit timestamps.

---

# 7. Relationships

Current Relationships

User

↓

Many Sessions

Future Relationships

User

↓

Repositories

↓

Workspaces

↓

Notifications

↓

Settings

Authentication is intentionally isolated from future product modules.

---

# 8. Indexing Strategy

## User

githubId

Unique Index

Purpose

Fast authentication lookup.

---

username

Unique Index

Purpose

Fast profile lookup.

---

email

Sparse Index

Purpose

Allow optional email addresses while supporting efficient lookups.

---

## Session

expiresAt

TTL Index

Purpose

Automatic deletion of expired sessions.

---

userId

(Recommended Future Index)

Purpose

Improve logout-all and session lookup performance.

---

refreshToken

(Recommended Future Index)

Purpose

Accelerate refresh token validation.

---

# 9. Data Lifecycle

## User

GitHub Login

↓

User Created (first login)

↓

Profile Updated

↓

Future Workspace Membership

↓

Account Archived (future)

---

## Session

Login

↓

Session Created

↓

Refresh Token Used

↓

lastUsedAt Updated

↓

Logout / Logout All

↓

Session Deleted

OR

↓

expiresAt Reached

↓

MongoDB TTL Deletes Document

---

# 10. Security Considerations

The database follows a security-first design.

Key principles include:

* GitHub OAuth removes the need to store passwords.
* Refresh Tokens are stored as hashes.
* Sessions are independently revocable.
* JWT Access Tokens remain stateless.
* Session expiration is enforced automatically through MongoDB TTL.

Future enhancements include:

* Encrypt GitHub Access Tokens at rest.
* Device trust management.
* Security audit logs.
* Session anomaly detection.

---

# 11. Engineering Decisions

| ID     | Decision                            | Reason                                                |
| ------ | ----------------------------------- | ----------------------------------------------------- |
| DB-001 | GitHub is the identity provider.    | Avoids maintaining password infrastructure.           |
| DB-002 | Separate Session collection.        | Enables logout, logout-all, and multi-device support. |
| DB-003 | Hash Refresh Tokens.                | Prevents token reuse if the database is compromised.  |
| DB-004 | MongoDB TTL Index.                  | Automatically removes expired sessions.               |
| DB-005 | GitHub remains the source of truth. | GitEase stores only application-specific data.        |

---

# 12. Future Improvements

The current database design intentionally keeps the authentication system lightweight.

Planned future improvements include:

* Session history
* Device management
* Workspace collections
* Repository metadata
* Activity logging
* Organization support
* Audit trails
* Encryption of GitHub access tokens
* Soft delete strategy where appropriate

---

# 13. Revision History

| Version | Description                                              |
| ------- | -------------------------------------------------------- |
| v0.1    | Initial database design for User and Session collections |
