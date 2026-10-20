# Changelog

All notable changes to AuthSec are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Passkeys / WebAuthn** — passwordless login and per-device passkey management.
- **Security center** — security score, quests, login-alert preferences, recovery-code regeneration.
- **RBAC editor** — admins can view and customise the role → permission matrix.
- **Threat feed** and **system settings** in the admin console, incl. maintenance mode.
- **Self-hosted Swagger UI** (`/api/docs`) backed by an OpenAPI 3.0 specification.
- **Maintenance mode** middleware that keeps health, docs, RBAC metadata and auth reachable.
- Optional **session idle timeout** and **CSRF double-submit** protection.
- **Optional admin IP allowlist**.
- **Test suites** — Vitest unit tests and Supertest integration tests (API) plus Testing Library
  component tests (web).
- **Docker** — multi-stage client image (nginx) and API image, wired together with Compose.
- **CI** — GitHub Actions workflow running lint, tests and a production build.
- Project docs: `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `LICENSE`.
- Environment samples: root `.env.example`, `server/.env.example`, `client/.env.example`.

### Fixed
- Refresh (`rotateSession`) now loads the real user so refreshed access tokens include `role`/`email`.
- Missing `serviceUnavailable` API error helper.
- `requireEmailVerification` default is now defined in the settings service.

### Changed
- Root scripts gained `test`, `docker:build`, `docker:up` and `docker:down`.

## [1.0.0] - 2026-01-01

### Added
- Initial MERN authentication & authorization platform: email/password auth, JWT access/refresh
  cookies, email verification, password reset, TOTP 2FA, session management, account lockout,
  audit logging, and a three-tier RBAC admin console with a hyper-modern React UI.
