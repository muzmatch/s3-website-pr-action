import * as github from "@actions/github";
import { ReposCreateDeploymentResponseData } from "@octokit/types";
import githubClient from "../githubClient";
import S3 from "../s3Client";
import checkBucketExists from "../utils/checkBucketExists";
import deactivateDeployments from "../utils/deactivateDeployments";
import s3UploadDirectory from "../utils/s3UploadDirectory";
import validateEnvVars from "../utils/validateEnvVars";

export const requiredEnvVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "GITHUB_TOKEN",
];

export default async (
  bucketName: string,
  uploadDirectory: string,
  environmentPrefix: string
) => {
  const websiteUrl = `http://${bucketName}.s3-website-us-east-1.amazonaws.com`;
  const { repo } = github.context;
  const branchName = github.context.payload.pull_request!.head.ref;

  console.log("PR Updated");

  validateEnvVars(requiredEnvVars);

  const bucketExists = await checkBucketExists(bucketName);

  if (!bucketExists) {
    console.log("S3 bucket does not exist. Creating...");
    await S3.createBucket({ Bucket: bucketName }).promise();

    console.log("Configuring bucket website...");
    await S3.putBucketWebsite({
      Bucket: bucketName,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: "index.html" },
        ErrorDocument: { Key: "404/index.html" },
      },
    }).promise();

    await S3.putBucketPolicy({
      Bucket: bucketName,
      Policy: `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${bucketName}/*"
        }
    ]
}`,
    }).promise();
  } else {
    console.log("S3 Bucket already exists. Skipping creation...");
  }

  await deactivateDeployments(repo, environmentPrefix);

  const deployment = await githubClient.repos.createDeployment({
    ...repo,
    ref: `refs/heads/${branchName}`,
    environment: `${environmentPrefix || "PR-"}${
      github.context.payload.pull_request!.number
    }`,
    auto_merge: false,
    transient_environment: true,
    required_contexts: [],
  });

  if (isSuccessResponse(deployment.data)) {
    await githubClient.repos.createDeploymentStatus({
      ...repo,
      deployment_id: deployment.data.id,
      state: "in_progress",
    });

    console.log("Uploading files...");
    await s3UploadDirectory(bucketName, uploadDirectory);

    await githubClient.repos.createDeploymentStatus({
      ...repo,
      deployment_id: deployment.data.id,
      state: "success",
      environment_url: websiteUrl,
    });

    console.log(`Website URL: ${websiteUrl}`);
  }
};

function isSuccessResponse(
  object: any
): object is ReposCreateDeploymentResponseData {
  return "id" in object;
}
