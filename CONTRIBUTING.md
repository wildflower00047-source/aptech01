# Contributing to AuthSec

Thanks for your interest in improving AuthSec! This guide keeps contributions smooth.

## Getting set up

```bash
git clone <your-fork>
cd Auth
cp server/.env.example server/.env
npm run dev          # installs deps, seeds if empty, runs API + web
```

- API → http://localhost:5000
- Web → http://localhost:5173
- Demo accounts: see [`creds.txt`](./creds.txt)

## Project layout

| Path | What lives here |
|------|-----------------|
| `server/src` | Express API (config, models, middleware, services, controllers, routes, validators) |
| `server/tests` | Vitest unit + Supertest integration tests |
| `client/src` | React SPA (api, app, features, components, pages, hooks) |
| `client/tests` | Vitest unit + Testing Library component tests |
| `scripts/dev.mjs` | Root dev bootstrap |

## Before you open a PR

Run the same checks CI runs:

```bash
npm run lint
npm test
npm --prefix client run build
```

- **Lint** must pass (`eslint`). Fix warnings where reasonable.
- **Tests** must pass. Add or update tests for behavior changes.
- Keep **commits focused** and write clear messages (imperative mood, e.g. "Add passkey rename endpoint").
- Match the existing **code style**: single quotes, semicolons, 2-space indentation, ESM imports
  with `.js` extensions on the server.

## Coding guidelines

- **Server**: prefer small, single-purpose middleware and services; validate every request with
  `express-validator`; throw `ApiError` for expected failures; never log secrets.
- **Client**: use RTK Query for data fetching; keep components accessible and keyboard-friendly;
  reuse the `ui/` primitives instead of one-off styles.
- **Security**: never commit real secrets. Add new configuration to the relevant `.env.example`
  and read it through `server/src/config/env.js`.
- **Never** add comments to code unless they explain non-obvious intent.

## Reporting bugs & requesting features

Open an issue with:
1. what you expected,
2. what actually happened,
3. steps to reproduce (request/response or screenshots help).

For security vulnerabilities, **do not** open a public issue — see [`SECURITY.md`](./SECURITY.md).
