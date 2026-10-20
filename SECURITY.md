# Security Policy

## Reporting a vulnerability

Please **do not** disclose security issues in public GitHub issues.

Instead, report them privately to the maintainers (e.g. via a GitHub Security Advisory or a
direct message to a maintainer). Include:

- a description of the issue and its impact,
- steps to reproduce (proof-of-concept, requests, or screenshots),
- affected versions/commit, and
- any suggested remediation.

We aim to acknowledge reports within a few days and will coordinate a fix and disclosure timeline
with you.

## Supported versions

The `main` branch is the supported line. Please reproduce issues there before reporting.

## Hardening checklist for deployments

AuthSec ships with secure defaults, but a real deployment should:

- [ ] Set strong, unique `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
      (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- [ ] Run with `NODE_ENV=production` and `COOKIE_SECURE=true` behind HTTPS.
- [ ] Set `CLIENT_URL` / `WEBAUTHN_ORIGIN` to your real origin and lock down CORS.
- [ ] Restrict MongoDB network access and use an authenticated connection string.
- [ ] Configure SMTP (`EMAIL_*`) so verification/reset/alert emails are delivered.
- [ ] Optionally set `ADMIN_IP_ALLOWLIST` to limit admin surfaces.
- [ ] Add TLS termination (nginx, load balancer, or a platform proxy) and rate limits at the edge.
- [ ] Rotate credentials and review the audit log regularly.
