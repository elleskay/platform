import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class SecretsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new secretsmanager.Secret(this, "PlatformAppSecrets", {
      secretName: "platform/app/shared",
      description: "Shared secrets across all apps on this platform",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "placeholder",
      },
    });
  }
}
