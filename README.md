# AuthSec — MERN Authentication & Authorization Platform

A production-grade, hyper-modern **MERN** (MongoDB, Express, React, Node) platform focused on
**authentication** and **authorization**, with a polished React UI built on Tailwind CSS,
Redux Toolkit, React Router and Framer Motion.

> Demo credentials, API reference and the full authorization matrix live in **[`creds.txt`](./creds.txt)**.

---

## ✨ Features

### Authentication ("who are you?")
- Email/password **registration** with **email verification**
- **Login** with JWT **access token (15m)** + **refresh token (7d)** rotation
- Tokens delivered as **httpOnly cookies** (and `Bearer` support)
- **Password reset** via emailed one-time token (SHA-256 hashed at rest)
- **Change password** (revokes all sessions)
- **Two-factor authentication (TOTP)** with QR setup + recovery codes
- **Passkeys / WebAuthn** — passwordless sign-in and device management
- **Session/device management** — list and revoke active sessions, with optional idle timeout
- **Account lockout** after repeated failed logins
- Login **alert emails**

### Authorization ("what can you do?")
- **Three role tiers**: `user`, `moderator`, `admin`
- Central **role → permission** matrix (`read:users`, `manage:roles`, …) exposed via `/api/meta/rbac`
- `authorize`, `authorizeMin` (hierarchy) and `authorizePermission` middleware
- Optional **admin IP allowlist** (`ADMIN_IP_ALLOWLIST`)
- Frontend **route guards** + `<Can>` component for inline UI gating
- Full **admin console**: users table (search/filter/sort/paginate), role & status management,
  **RBAC editor**, **audit log** viewer, **threat feed**, **system settings** and platform stats

### Security & hardening
- `helmet`, CORS allow-list, `express-rate-limit` (global + auth + strict)
- **CSRF double-submit** protection for state-changing requests
- `express-validator` request validation, `bcryptjs` hashing (12 rounds)
- Refresh-token **reuse detection** (revokes all sessions)
- **Audit logging** with IP, device and metadata
- **Security score & quests** to nudge users toward safer settings
- Configurable **maintenance mode** (admins can still sign in and turn it off)
- Consistent JSON error envelope with proper status codes

---

## 🧱 Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite, Redux Toolkit + RTK Query, React Router 6, Tailwind CSS, Framer Motion, react-hot-toast, react-icons |
| Backend  | Node.js, Express, Mongoose, JWT, bcryptjs, speakeasy (TOTP), qrcode, nodemailer, `@simplewebauthn/server`, ua-parser-js |
| Database | MongoDB (Atlas or local) |
| Docs     | OpenAPI 3.0 + self-hosted Swagger UI (`swagger-ui-dist`) |
| Testing  | Vitest, Supertest (API), Vitest + Testing Library + jsdom (web) |
| Tooling  | ESLint (flat config), Prettier, Docker & Compose, GitHub Actions |

---

## 📂 Project Structure

```
Auth/
├─ creds.txt                 # credentials + API cheat-sheet (auth & authorization)
├─ docker-compose.yml        # mongo + api + web (nginx) stack
├─ .env.example              # root env for docker compose
├─ .github/workflows/ci.yml  # lint + test + build pipeline
├─ package.json              # root — single-command `npm run dev`
├─ scripts/dev.mjs           # one-command bootstrap (install + seed + run both apps)
├─ server/                   # Express REST API
│  ├─ Dockerfile
│  ├─ .env.example
│  ├─ vitest.config.js
│  ├─ tests/                 # unit + integration (supertest) tests
│  └─ src/
│     ├─ config/             # env, db connection
│     ├─ models/             # User, Session, AuditLog, LoginAttempt, Setting, …
│     ├─ middleware/         # authenticate, authorize, validate, csrf, rateLimit,
│     │                      #   maintenance, ipAllowlist, error
│     ├─ services/           # token, email, audit, settings, security score
│     ├─ controllers/        # auth, passkey, user, admin, security
│     ├─ validators/         # express-validator chains
│     ├─ routes/             # auth, users, security, admin, docs, index
│     ├─ docs/               # OpenAPI 3.0 specification
│     ├─ utils/              # ApiError, asyncHandler, crypto, roles, cookies, logger
│     ├─ scripts/seed.js     # demo data
│     ├─ app.js              # express app
│     └─ server.js           # bootstrap
└─ client/                   # React SPA
   ├─ Dockerfile
   ├─ nginx.conf
   ├─ .env.example
   ├─ vitest.config.js
   ├─ tests/                 # unit + component tests
   └─ src/
      ├─ api/                # axios instance (auto refresh) + RTK Query slice
      ├─ app/                # store, baseQuery, hooks
      ├─ features/           # authSlice, uiSlice
      ├─ components/         # ui/, layout/, common/ (guards, etc.)
      ├─ pages/              # Landing, auth/*, Dashboard, Profile, Security, admin/*
      ├─ hooks/              # useAuth, useTheme
      └─ App.jsx             # routing
```

---

## 🚀 Getting Started

### One command (recommended)

From the project root, in a **single terminal**:

```bash
npm run dev
```

That one command automatically:
1. installs the `server` and `client` dependencies (first run only),
2. seeds the demo users **only if the database is empty**,
3. starts the **API** (`http://localhost:5000`) and the **web app** (`http://localhost:5173`) together,
4. prefixes each line of output with `API` or `WEB` — press **Ctrl+C once** to stop everything.

Then open **http://localhost:5173** and sign in with a demo account (see `creds.txt`),
or use the one-click **Demo accounts** buttons on the login page.

> Requires Node.js 18+ (20 recommended, see `.nvmrc`) and a reachable MongoDB.

### Docker (whole stack)

```bash
cp .env.example .env      # then edit the secrets
npm run docker:up         # or: docker compose up --build
```

- Web → http://localhost:8080 (nginx serving the built SPA, proxying `/api`)
- API → http://localhost:5000
- MongoDB is seeded with the demo users on first boot.

Stop with `npm run docker:down`.

### Manual (separate terminals)

<details>
<summary>Prefer running the API and web app separately?</summary>

**Backend**

```bash
cd server
npm install
cp .env.example .env   # adjust as needed
npm run seed           # creates admin / moderator / user demo accounts
npm run dev            # http://localhost:5000
```

**Frontend**

```bash
cd client
npm install
cp .env.example .env   # optional; defaults to /api proxy
npm run dev            # http://localhost:5173  (proxies /api → :5000)
```

</details>

### Scripts

| Location | Command | Description |
|----------|---------|-------------|
| root | `npm run dev` | Install (if needed) + seed (if empty) + run API & web together |
| root | `npm run setup` | Only the install + seed steps |
| root | `npm run seed` | Reset & seed demo users |
| root | `npm run build` | Production build of the client |
| root | `npm run lint` | Lint both projects |
| root | `npm test` | Run API + web test suites |
| root | `npm run docker:up` / `docker:down` / `docker:build` | Manage the Compose stack |
| server | `npm run dev` / `start` | Start API (nodemon / plain) |
| server | `npm run seed` / `seed:if-empty` | Reset-seed / seed only when empty |
| server | `npm run lint` | ESLint |
| server | `npm test` / `test:watch` / `test:coverage` | Vitest suites |
| client | `npm run dev` / `build` / `preview` | Vite dev / build / preview |
| client | `npm run lint` | ESLint |
| client | `npm test` / `test:watch` / `test:coverage` | Vitest suites |

---

## ⚙️ Configuration

All configuration is environment-driven. Copy the provided samples and adjust:

- **`server/.env.example`** → `server/.env` — port, `MONGO_URI`, JWT secrets & TTLs, cookie flags,
  bcrypt rounds, lockout policy, TOTP issuer, WebAuthn RP/origin, SMTP, admin IP allowlist, seed admin.
- **`client/.env.example`** → `client/.env` — `VITE_API_URL` (defaults to `/api`).
- **`.env.example`** → `.env` — variables consumed by `docker compose`.

> In production (`NODE_ENV=production`) the API **refuses to boot** unless `MONGO_URI`,
> `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are set. Generate secrets with:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@authsec.dev` | `Admin@12345` |
| Moderator | `moderator@authsec.dev` | `Moderator@123` |
| User | `user@authsec.dev` | `User@12345` |

> **Note:** Passwords require a strong password (8–72 chars, upper, lower, number, symbol).
> In development (no SMTP host) all emails — verification, reset, alerts — are printed to the
> **server console**.

---

## 🗺️ API Overview

Base URL: `http://localhost:5000/api`

**Meta** — `GET /health` (deep health incl. DB state), `GET /meta/rbac` (roles + permission matrix).

**Authentication** — `/auth`: `register`, `login`, `refresh`, `logout`, `logout-all`,
`me`, `verify-email`, `resend-verification`, `forgot-password`, `reset-password`,
`change-password`, `2fa/setup|verify|disable`, `sessions`, `sessions/:id`, plus passkeys
(`/auth/passkey/login/options|verify`, `/auth/passkeys`, `/auth/passkeys/register/options|verify`).

**Security center** — `/security`: `GET /` (score, quests, status), `POST /quests/:key/claim`,
`PATCH /login-alerts`, `POST /recovery-codes/regenerate`.

**Profile** — `/users/profile`: `GET`, `PATCH`, `DELETE`.

**Admin** — `/admin`: `stats`, `users`, `users/:id`, `users/:id/role`, `users/:id/status`,
`audit-logs`, `threats`, `rbac` (+ `rbac/:role`, `rbac/:role/reset`), `settings`.
Access is enforced by role tier + permission — see `creds.txt` for the full matrix and `curl` examples.

---

## 📖 API Docs

Interactive **Swagger UI** is served by the API itself (no CDN / inline scripts, CSP-safe):

- UI → http://localhost:5000/api/docs
- Spec → http://localhost:5000/api/docs/openapi.json (also `/api/openapi.json`)

The docs sit behind no auth so they remain reachable during maintenance mode.

---

## 🧪 Testing

Both packages ship with [Vitest](https://vitest.dev):

```bash
npm test                    # run everything from the root
npm --prefix server test    # API: unit + integration (supertest); spins up against MONGO_URI_TEST
npm --prefix client test    # Web: unit + component (Testing Library + jsdom)
```

- **API integration tests** auto-detect a MongoDB at `MONGO_URI_TEST`
  (default `mongodb://127.0.0.1:27017/authsec_test`) and `skip` gracefully when none is reachable,
  so `npm test` never fails on a machine without a database.
- Coverage reports: `npm run test:coverage` in either package.

---

## 🤖 CI

`.github/workflows/ci.yml` runs on every push/PR:

- **API** — `npm ci`, `eslint`, `vitest` against a MongoDB service container.
- **Web** — `npm ci`, `eslint`, `vitest`, and a production `vite build`.

---

## 🧾 Verified

- Backend boots and connects to MongoDB; `/api/health` returns `200`
- `login` sets httpOnly cookies; `/auth/me` authenticates via cookie
- Full lifecycle: register → (dev) email → verify → login
- Authorization: `admin` gets `200` on admin routes; regular `user` gets `403`
- Admin data endpoints (`users`, `stats`, `audit-logs`), sessions and RBAC meta all return data
- Client `npm run build`, both `npm run lint`, and both test suites pass clean

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE). Use it, fork it, ship it.
