# Deploy guide

## One-time AWS setup

### 1. Bootstrap CDK

```bash
npx cdk bootstrap aws://<account-id>/<region>
```

### 2. Create OIDC role for GitHub Actions

This lets GitHub Actions assume an AWS role without long-lived credentials.

In AWS IAM:

1. Add an OIDC identity provider for `token.actions.githubusercontent.com`
2. Create a role with trust policy scoped to your GitHub repo
3. Attach a policy granting CDK deploy permissions
4. Copy the role ARN

In GitHub:

1. Settings, Secrets and variables, Actions
2. Add secret `AWS_DEPLOY_ROLE_ARN` = the role ARN
3. Add variable `AWS_REGION` = your target region

Detailed walkthrough: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html

## Per-app deploy

Each app extends the base CDK stack with its own resources.

```
infra/
├── cdk/
│   ├── base/          # platform-wide: VPC, IAM, ECR, Secrets, RDS module
│   └── <app-name>/    # per-app: ECS service, Lambda, CloudFront, etc.
```

Deploy via:

```bash
cd infra/cdk/base
npx cdk deploy --all
cd ../<app-name>
npx cdk deploy --all
```

Or via GitHub Actions: push to `main` triggers `.github/workflows/deploy.yml`.

## Rollback

CDK does not auto-rollback. To revert:

1. `git revert <bad-commit>` and push
2. Pipeline redeploys previous version

For data migrations, never run destructive operations in deploy. Use a separate migration job with explicit approval.

## Environments

Default: `staging` and `production`. Each is a separate AWS account or at minimum a separate CDK stack with environment-scoped names.

Promote staging to production by merging to `main` after staging smoke tests pass.
