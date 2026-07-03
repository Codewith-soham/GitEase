# GitEase Backend

Backend service for GitEase — a visual, collaborative Git workspace built on top of GitHub. See [docs/prd.md](docs/prd.md) for product context and [docs/technical/api_spec.md](docs/technical/api_spec.md) for the full API contract.

## Tech Stack

- Node.js (ESM) + Express 5
- MongoDB (Mongoose)
- JWT-based authentication with GitHub OAuth
- Zod for validation

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file with:

```
PORT=
MONGO_URL=
CLIENT_ID=
CLIENT_SECRET=
JWT_ACCESS_TOKEN=
JWT_ACCESS_TOKEN_EXPIRY=
JWT_REFRESH_TOKEN=
JWT_REFRESH_TOKEN_EXPIRY=
```

`CLIENT_ID` / `CLIENT_SECRET` are the GitHub OAuth App credentials used for login and to access the GitHub API on behalf of the user.

### Scripts

- `npm run dev` — start the server with nodemon
- `npm start` — start the server
- `npm test` — run the test suite
- `npm run format` — format the codebase with Prettier

## Implemented Features

### Authentication (`/api/auth/v1`)

- GitHub OAuth login (`/github`, `/github/callback`)
- Access/refresh token issuance and rotation (`/refresh-token`)
- Current user (`/me`)
- Logout / logout all sessions (`/logout`, `/logoutall`)
- List active sessions (`/sessions`)

### Repositories & Branches (`/api/repository/v1`)

- List the authenticated user's GitHub repositories (`GET /repo`)
- Create a new GitHub repository (`POST /repo`)
- List branches for a repository (`GET /repo/:repoName/branches`)
- Create a new branch from a base branch (`POST /repo/:repoName/branches`)

Full request/response details are documented in [docs/technical/api_spec.md](docs/technical/api_spec.md).

## Documentation

- [Product Requirements](docs/prd.md)
- [API Specification](docs/technical/api_spec.md)
- [Error Codes](docs/technical/ERROR_CODES.md)
- [Database Schema](docs/technical/database.md)
- [Authentication FDD](docs/epics/authentication_FDD.md)
