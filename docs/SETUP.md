# Setup checklist

Follow in order. Skipping steps will bite you later.

## 1. Clone from template

```bash
gh repo create my-app --template <you>/platform --clone --private
cd my-app
```

## 2. GitHub repo settings

- [ ] Set default branch to `main`
- [ ] Enable branch protection on `main`: require PR, require CI to pass
- [ ] Enable Dependabot alerts and security updates (Settings, Security)
- [ ] Enable secret scanning (Settings, Code security)
- [ ] Add `CODEOWNERS` entry for your GitHub username
- [ ] Update `SECURITY.md` with your real disclosure email

## 3. AWS account

- [ ] Create or pick an AWS account
- [ ] Bootstrap CDK in your region: `npx cdk bootstrap aws://<account>/<region>`
- [ ] Create an OIDC role for GitHub Actions deploys (see `docs/DEPLOY.md`)
- [ ] Add `AWS_DEPLOY_ROLE_ARN` to GitHub Actions secrets
- [ ] Add `AWS_REGION` to GitHub Actions variables

## 4. Local env

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in AWS account ID, region
- [ ] Never commit `.env.local`

## 5. Pick an app variant

See `docs/variants/`:

- `default-nextjs.md` for most apps
- `nestjs-api.md` for apps needing a separate API service
- `ai-native.md` for LLM-tooling apps

## 6. Wire deploy

- [ ] Rename `.github/workflows/deploy.yml.template` to `deploy.yml`
- [ ] Customize the deploy steps for your app
- [ ] Test with a staging deploy first

## 7. First commit

```bash
git add .
git commit -m "chore: initial setup from platform template"
git push -u origin main
```

CI should pass on push. Deploy runs on merge to `main`.

## What you always forget

- The AWS OIDC role for GitHub Actions (step 3)
- Branch protection (step 2)
- Updating `SECURITY.md` disclosure email (step 2)
- Bootstrapping CDK in the target region (step 3)
