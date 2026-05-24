# platform

TypeScript + AWS platform template. CI/CD, IaC, security, governance. Ready to ship apps on.

## What this is

A platform-layer starting point for shipping production apps. Contains only what is identical across every app: CI/CD workflows, infrastructure-as-code base, security policy, dependency hygiene, repo conventions.

It does not contain app code (no web framework, no DB schema, no UI library). Pick those per app.

## What's inside

| Area | Where |
|---|---|
| CI (typecheck, lint, build) | `.github/workflows/ci.yml` |
| Security scanning (CodeQL, secret scan) | `.github/workflows/security.yml` |
| Deploy pipeline skeleton | `.github/workflows/deploy.yml.template` |
| Dependency updates | `.github/dependabot.yml` |
| AWS CDK base (VPC, IAM, ECR, Secrets, RDS module) | `infra/cdk/base/` |
| Setup checklist | `docs/SETUP.md` |
| Security policy | `SECURITY.md` |
| Secure dev lifecycle docs | `docs/SSDLC.md` |
| Deploy guide | `docs/DEPLOY.md` |
| App variant guides | `docs/variants/` |
| TS/ESLint/Prettier base configs | root |
| Conventional commits | `commitlint.config.mjs` |

## How to use

```bash
gh repo create my-app --template <you>/platform --clone
cd my-app
# add your app: npx create-next-app apps/web, or NestJS, or whatever fits
# wire it to the existing CI + CDK base
```

Read `docs/SETUP.md` for the full checklist.

## App variants

Per-app stack guidance lives in `docs/variants/`:

- `default-nextjs.md` for Next.js + Postgres apps
- `nestjs-api.md` for apps that need a separate NestJS API
- `ai-native.md` for apps with LLM tooling (MCP, model gateway)

## Layers

This template is the **platform layer**. Two more layers live outside:

- **Shared layer:** packages reused across some apps (design tokens, auth helpers). Extract once 2+ apps duplicate the same code.
- **App layer:** product-specific code in each app's own repo.

## License

MIT.
