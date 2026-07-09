import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { env } from "../../env.js";
import type { StorageProvider } from "./types.js";

export function createCloudinaryStorage(): StorageProvider {
  const config = env.cloudinary!;
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });

  // Cloudinary's public_id carries no file extension — strip it so a later delete()
  // targets the exact asset this upload created, not a literal "name.jpg" that doesn't
  // exist as a public_id.
  function publicId(key: string) {
    return `${config.folder}/${key.replace(/\.[^./]+$/, "")}`;
  }

  return {
    upload(key, buffer, contentType) {
      return new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId(key),
            resource_type: contentType.startsWith("video/") ? "video" : "image",
            overwrite: true,
          },
          (err, result) => {
            if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
            resolve(result.secure_url);
          }
        );
        Readable.from(buffer).pipe(stream);
      });
    },
    async delete(key) {
      await cloudinary.uploader.destroy(publicId(key));
    },
  };
}
