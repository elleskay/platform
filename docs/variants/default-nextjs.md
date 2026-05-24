# Variant: Default Next.js

Use this for most apps. Covers the OGP listings that ask for TypeScript, React, Next.js, Postgres, AWS.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- PostgreSQL via Drizzle ORM
- Auth.js (NextAuth) for auth
- Sentry for errors
- Zod for validation
- Hosted on AWS via CDK (ECS Fargate or Lambda + CloudFront)

## Setup

```bash
npx create-next-app@latest apps/web --typescript --tailwind --app --eslint
cd apps/web
npx shadcn@latest init
npm install drizzle-orm pg zod @auth/core @auth/drizzle-adapter
npm install -D drizzle-kit @types/pg
```

Extend `tsconfig.base.json`:

```jsonc
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

## Security baseline

Add to `apps/web/next.config.ts`:

```ts
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

export default {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

## Infra

Add an app-specific CDK stack at `infra/cdk/web/` that:

- Imports VPC and shared resources from `infra/cdk/base`
- Provisions an RDS Postgres instance (or uses shared one)
- Provisions the deploy target (Lambda + CloudFront, or ECS Fargate behind ALB)

## Maps to OGP roles

ActiveSG, KampungSpirit, NTES, SGC, Armoury, generic SWE, Senior/Lead SWE.
