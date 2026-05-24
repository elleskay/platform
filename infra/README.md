# Infra

AWS CDK in TypeScript. Two-level structure:

- `cdk/base/` — platform-wide resources used by every app (VPC, IAM, ECR, Secrets Manager, optional shared RDS)
- `cdk/<app-name>/` — per-app stacks added when you build an app

## Deploy

```bash
cd cdk/base
npm ci
npx cdk bootstrap   # one-time per account/region
npx cdk deploy --all
```

## Adding a per-app stack

```bash
mkdir cdk/my-app
cd cdk/my-app
# create a new CDK app or extend the base
```

Import shared resources from `cdk/base` outputs (via SSM Parameter Store or stack references).

## Why CDK instead of Terraform

- TypeScript matches the rest of the stack
- One language across infra and app
- Direct AWS support
- CloudFormation underneath gives drift detection for free

Terraform is also fine. Pick one, do not mix.
