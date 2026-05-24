# Platform template, Claude Code conventions

This repo is a platform-layer template. When working in repos cloned from it, follow these rules.

## What belongs in this template

Only the cross-cutting platform layer:

- CI/CD workflows
- IaC base (AWS CDK)
- Security policy, SSDLC docs
- Repo conventions (commitlint, CODEOWNERS, PR template)
- Base TS/ESLint/Prettier configs
- `.env.example` for platform-level keys only
- Dependabot

## What does NOT belong

- App code (no Next.js, no NestJS, no UI components)
- DB schemas
- Business logic
- Per-product secrets or config

When asked to add app code, scaffold it under `apps/<name>/` in the cloned repo, not in the template.

## Stack conventions for apps built on this template

- TypeScript everywhere, strict mode
- Node 20+
- PostgreSQL for relational data
- AWS via CDK for infra
- GitHub Actions for CI/CD
- Zod for validation at boundaries
- Sentry for errors

## Style

- No em dashes anywhere (chat, code, docs, UI strings). Use comma, period, parens, or colon.
- No emojis in code or docs unless explicitly requested.
- Conventional Commits for commit messages.
- Keep README and docs short. One-line entries where possible.

## Security defaults

- Never commit secrets. `.env.local` is gitignored, production secrets live in AWS Secrets Manager.
- Helmet-equivalent security headers on every app.
- Input validation via Zod on every API boundary.
- Rate limiting on auth and payment routes.
- Dependabot enabled, weekly cadence.

## When adding a new app to a cloned repo

1. Pick a variant from `docs/variants/`
2. Scaffold under `apps/<name>/`
3. Extend `tsconfig.base.json` and `eslint.config.base.mjs`
4. Add an entry to the deploy workflow
5. Add the app's CDK stack under `infra/cdk/<name>/` extending the base
