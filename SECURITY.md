# Security Policy

## Reporting a vulnerability

Report security issues through **GitHub Private Vulnerability Reporting:** [github.com/elleskay/platform/security/advisories/new](https://github.com/elleskay/platform/security/advisories/new). Reports are private, tracked, and let us coordinate a fix and CVE if needed.

Do not open public GitHub issues for security problems.

Expected response time: 72 hours.

## Supported versions

Latest `main` only.

## Scope

This template provides platform-layer security defaults:

- Dependency scanning via Dependabot
- Code scanning via GitHub CodeQL
- Secret scanning via GitHub native
- Security headers via Next.js `headers()` in `next.config.ts`
- Rate limiting on sensitive routes
- Input validation via Zod
- Secrets in GitHub Actions secrets and Lambda env vars, never committed to the repo

Apps built on this template are expected to maintain these defaults and add app-specific controls as needed.

See `docs/SSDLC.md` for the secure development lifecycle this template assumes.
