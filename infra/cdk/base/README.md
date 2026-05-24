# CDK base

Platform-wide AWS resources every app depends on.

## Stacks

- `NetworkStack` — VPC with public, private, and isolated subnets across 2 AZs
- `SecretsStack` — shared Secrets Manager secret
- `RegistryStack` — ECR repository for container images

## Setup

```bash
npm ci
npx cdk bootstrap aws://<account>/<region>   # one-time
npx cdk deploy --all
```

## Adding new platform-wide resources

Add a new file under `lib/<name>-stack.ts`, instantiate it in `bin/app.ts`. Keep stacks small and focused.

## Per-app resources

Do not add per-app resources here. Create a sibling directory under `infra/cdk/<app-name>/` for those.
