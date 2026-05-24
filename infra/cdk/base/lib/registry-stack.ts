import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export class RegistryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ecr.Repository(this, "AppRepo", {
      repositoryName: "platform/apps",
      imageScanOnPush: true,
      lifecycleRules: [{ maxImageCount: 30, description: "Keep last 30 images" }],
    });
  }
}
