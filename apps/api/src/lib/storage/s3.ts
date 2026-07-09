import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../env.js";
import type { StorageProvider } from "./types.js";

/** Works for real AWS S3 and any S3-compatible endpoint (MinIO in dev, DigitalOcean
 * Spaces, Cloudflare R2, etc.) — same client either way, just a different endpoint. */
export function createS3Storage(): StorageProvider {
  const config = env.s3!;
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  function publicUrlFor(key: string) {
    return `${config.publicUrl}/${key}`;
  }

  return {
    async upload(key, buffer, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      return publicUrlFor(key);
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  };
}
