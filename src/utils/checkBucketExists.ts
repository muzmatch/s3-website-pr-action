import { HeadBucketCommand } from "@aws-sdk/client-s3";
import S3 from "../s3Client";

export default async (bucketName: string) => {
  try {
    await S3.send(
      new HeadBucketCommand({
        Bucket: bucketName,
      })
    );
    return true;
  } catch (e) {
    return false;
  }
};
