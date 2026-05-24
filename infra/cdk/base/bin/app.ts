#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { SecretsStack } from "../lib/secrets-stack";
import { RegistryStack } from "../lib/registry-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "ap-southeast-1",
};

new NetworkStack(app, "PlatformNetwork", { env });
new SecretsStack(app, "PlatformSecrets", { env });
new RegistryStack(app, "PlatformRegistry", { env });
