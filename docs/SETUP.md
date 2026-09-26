# Setup checklist

Follow in order on a fresh clone. Skipping steps will bite you later.

## 1. Clone the template

```bash
gh repo create my-app --template elleskay/platform --clone --private
cd my-app
npm install
```

## 2. GitHub repo settings

- [ ] Set default branch to `main`
- [ ] Enable branch protection on `main`: require a PR, and require the `Spec coverage gate` check (from `test.yml`, step 3) plus the CI checks
- [ ] Enable Dependabot alerts and security updates (Settings, Security)
- [ ] Enable secret scanning and private vulnerability reporting (Settings, Code security)
- [ ] Update `.github/CODEOWNERS` to your GitHub handle
- [ ] Point the advisory link in `SECURITY.md` at your repo

## 3. Create your app

The clone comes with `apps/_demo/` (a working demo: Auth.js + middleware + SignOutButton + healthcheck). CI builds it for its self-test, so leave it in place and create your app at `apps/web/`. Two paths:

**Option A: Start fresh**

```bash
npx create-next-app@latest apps/web --typescript --tailwind --app --eslint --use-npm
cd apps/web
npm install next-auth@beta zod @opennextjs/aws
# Pick your data layer
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
# Overlay the patterns
cp ../_template/next.config.ts ./
cp ../_template/auth.config.ts ./
cp ../_template/middleware.ts ./
mkdir -p components
cp ../_template/components/SignOutButton.tsx components/
cd ../..
```

These four overlays carry the deploy fixes. For the optional helpers (Sentry, PostHog, email, rate limiting, UI primitives), see `apps/_template/README.md`.

**Option B: Grow from the demo**

```bash
cp -r apps/_demo apps/web
```

Then edit `apps/web/auth.ts` to swap the hardcoded `DEMO_USER` for your real provider, add a database, and add routes. The patterns are already in place. (Option A has no `auth.ts`; create one like `apps/_demo/auth.ts` only if you want credentials auth.)

### Copy the spec-driven test scaffolding

Every app on this platform is built and gated against a spec (see `docs/TESTING.md`).

```bash
# Option A only: spec, Vitest setup, example tests (Option B has these from the demo)
cp -r apps/_template/specs apps/web/
cp -r apps/_template/tests apps/web/
cp apps/_template/vitest.config.ts apps/web/
# Both options: Playwright config, and the gate workflow in the ROOT
# .github/workflows/ (the only place GitHub runs workflows from)
cp apps/_template/playwright.config.ts apps/web/
cp apps/_template/.github/workflows/test.yml .github/workflows/
```

Option B apps put their Playwright specs in `tests/e2e/` (see `apps/_template/tests/e2e/home.spec.ts`). Option A apps wire the spec-test ESLint rule into the app's flat config so a `specTest()` with no `expect()` fails lint (the demo's config already has it). Both merge the test scripts from `apps/_template/tests/README.md` into the app's `package.json`. `test.yml` also calls the app's `db:migrate` and `db:seed` scripts; delete those two steps if the app has no database. Without this scaffolding the coverage gate and `npm run test:spec` have nothing to run.

## 4. Configure CDK for the app

Copy the CDK package for your app. Keep `infra/cdk/_template/`: CI synths it against `apps/_demo/` as the template's self-test.

```bash
cp -r infra/cdk/_template infra/cdk/<your-app>
```

Edit `infra/cdk/<your-app>/bin/app.ts` to rename the stack id (e.g. `AppServerless` to `ArmouryServerless`). The stack id becomes the CloudFormation stack name. Step 6 points the deploy workflow at this copy.

## 5. AWS credentials for the one-time setup

- [ ] Create an AWS account (or use an existing one)
- [ ] Region: pick one close to your users (e.g. `ap-southeast-1` for Singapore)
- [ ] Configure local AWS credentials (`aws configure` or SSO) that can create an IAM role and an OIDC provider and bootstrap CDK. An admin session is simplest; step 6 is the only thing that uses it.

Deploys never use these credentials. They run on the OIDC role that step 6 creates, which carries the least-privilege `infra/iam/cdk-deploy-policy.json` instead of `AdministratorAccess`.

## 6. Connect GitHub and AWS (one command)

For automated deploys via `.github/workflows/deploy.yml`, run the connect
script. You (or your AI coding agent) run it once per repo, and it wires the
whole GitHub + AWS connection: it ensures the OIDC provider, bootstraps CDK,
deploys the `_setup` role, provisions a database (Neon), generates
`AUTH_SECRET`, and sets every GitHub Actions secret and variable.

```bash
npm run setup -- --cdk-dir infra/cdk/<your-app>
# or: scripts/connect.sh --cdk-dir infra/cdk/<your-app> --region ap-southeast-1
# preview without changing anything: add --dry-run
```

Prerequisites: `gh` (authenticated), `aws` (the step 5 credentials), and
Node 22+. Optional: `neonctl` to auto-provision the database (otherwise the
script asks for a `DATABASE_URL`). Re-running reuses the AWS pieces, but pass
`--database-url` or `--skip-db` on a re-run or it provisions a second
database. Every run also rotates `AUTH_SECRET`, which signs users out at the
next deploy.

After it finishes there is nothing else to set by hand. It configures:

- **secrets**: `AWS_DEPLOY_ROLE_ARN`, `DATABASE_URL`, `AUTH_SECRET`
- **variables**: `AWS_REGION`, `ALLOWED_ORIGINS` (wildcards for the first deploy),
  plus `CDK_DIR` / `APP_DIR` if you passed non-default paths.

`APP_URL` is set after your first deploy, once you know the CloudFront URL
(NextAuth needs the canonical URL). The script prints the exact command. To
skip the two-pass dance, pass a `customDomain` to `NextjsServerless` up front
and `--app-url` to setup (see `docs/DEPLOY.md` gotcha #7).

<details>
<summary>Prefer to do it by hand?</summary>

```bash
cd infra/cdk/_setup
npm install
npx cdk deploy -c repo=<your-github-org>/<your-app>
```

That creates the OIDC trust + IAM role and outputs the `DeployRoleArn`. See
`infra/cdk/_setup/README.md` for prerequisites. Then set the secrets/variables
listed above on the app repo manually (`gh secret set` / `gh variable set`).
For `ALLOWED_ORIGINS` on the first build, use
`*.cloudfront.net,*.lambda-url.<region>.on.aws`, then refine to specific hosts.
</details>

## 7. First deploy

```bash
git add . && git commit -m "chore: initial scaffold"
git push -u origin main
```

GitHub Actions runs CI, builds OpenNext, deploys via CDK, smoke-tests the URL. If all checks pass, your CloudFront URL is live.

For the cleanest first deploy (no two-pass dance), provision a custom domain + ACM cert first and pass them to `NextjsServerless` via the `customDomain` prop. See `docs/DEPLOY.md` gotcha #7 for the trade-off.

## What you always forget

- Step 2: Requiring the `Spec coverage gate` check (otherwise a red gate does not block the merge)
- Step 3: Putting `test.yml` in the root `.github/workflows/` (GitHub ignores `apps/web/.github/`)
- Step 4: Renaming the stack id in `bin/app.ts` (otherwise all your apps share the same CloudFormation stack name)
- Step 6: Setting `APP_URL` after the first deploy (NextAuth breaks without it), then tightening `ALLOWED_ORIGINS` to the real hosts
