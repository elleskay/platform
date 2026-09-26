# apps/_template: reference overlay files

Files you copy into a new app on first scaffold. They encode the production patterns this platform discovered the hard way.

## What's here

| File | Purpose |
|---|---|
| `next.config.ts` | Security headers + Server Actions `allowedOrigins` (read from `ALLOWED_ORIGINS` env at build time) |
| `auth.config.ts` | Edge-safe NextAuth config for middleware (no DB calls) |
| `middleware.ts` | Auth-only middleware that reads `auth.config.ts` |
| `components/SignOutButton.tsx` | Client component for signout (server-action signout doesn't clear cookies on OpenNext) |
| `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` | Sentry wiring. No-ops without `SENTRY_DSN` |
| `components/PostHogProvider.tsx` | PostHog analytics provider. No-ops without `NEXT_PUBLIC_POSTHOG_KEY` |
| `components/Toaster.tsx` | Sonner toast root. Mount once in layout. |
| `lib/email.ts` | Resend helper. No-ops without `RESEND_API_KEY` |
| `lib/rate-limit.ts` | Upstash Redis rate-limit factory. No-ops without `UPSTASH_REDIS_*` |
| `components/StatCard.tsx` | Generic stat card with lucide icon, value, tone, optional delta |
| `components/EmptyState.tsx` | Generic empty state with lucide icon, title, optional CTA |
| `components/PageHeader.tsx` | Generic page header with title, description, actions |
| `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx` | next-themes wiring + sun/moon/system toggle |
| `components/forms-README.md` | Doc on the two valid form patterns; install RHF per app if you want pattern B |
| `components/theming-README.md` | Doc on picking brand color, icon, layout, dashboard composition per app |
| `specs/example.yml`, `tests/`, `vitest.config.ts`, `playwright.config.ts` | Spec-driven test scaffolding. See `tests/README.md` and `docs/TESTING.md` |
| `.github/workflows/test.yml` | The app's spec coverage gate. Belongs in the repo root `.github/workflows/`, the only place GitHub runs workflows from |

## Why each one exists

Each fixes a bug or removes friction we hit on real deploys. See `docs/DEPLOY.md` for the production gotchas.

- `allowedOrigins` from env → fixes "Invalid Server Actions request" when CloudFront forwards to Lambda
- `auth.config.ts` separate from `auth.ts` → middleware runs on Edge runtime and can't import DB client
- Client-side `SignOutButton` → server-side `signOut` doesn't clear cookies through OpenNext's Lambda streaming
- Sentry/PostHog/Sonner/Resend/Upstash → universal-enough that pre-wiring saves every app from rebuilding the same plumbing

## How to use

When scaffolding a new app, from the repo root:

```bash
# 1. Create the Next.js app shell
npx create-next-app@latest apps/web --typescript --tailwind --app --eslint --use-npm

# 2. Overlay these reference files, move the gate workflow to the repo root,
#    and drop the template's own docs
cp -r apps/_template/. apps/web/
mkdir -p .github/workflows
mv apps/web/.github/workflows/test.yml .github/workflows/
rm -r apps/web/.github apps/web/README.md apps/web/components/*-README.md

# 3. Install runtime deps
cd apps/web
npm install next-auth@beta zod @opennextjs/aws
npm install @sentry/nextjs posthog-js sonner resend @upstash/ratelimit @upstash/redis
```

Then:

- Write your own `auth.ts` that imports `auth.config.ts` and adds the provider (Credentials, OAuth, whatever fits).
- The UI primitives import shadcn/ui components (`card`, `button`, `dropdown-menu`, and `cn` from `lib/utils`), `lucide-react`, and `next-themes`. Run `npx shadcn@latest init`, `npx shadcn@latest add card button dropdown-menu`, and `npm install lucide-react next-themes`, or delete the primitives you don't use. `next build` typechecks every file, so an unresolved import fails the build even when nothing renders the component.
- Rename `specs/example.yml` to `specs/<app>.yml`, replace the example requirements, and follow `tests/README.md` for the test scripts and dev dependencies.

## What this template does NOT include

- Auth providers: your app picks
- Database schema or ORM: your app picks
- A component library: the UI primitives assume shadcn/ui, installed per app
- React Hook Form: see `components/forms-README.md` for the trade-off; install per app
- Page layouts and routes: your app picks

This is the minimal shell + universal infrastructure. Everything else is product code.
