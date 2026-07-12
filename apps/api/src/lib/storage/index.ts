import { env } from "../../env.js";
import type { StorageProvider } from "./types.js";
import { createS3Storage } from "./s3.js";
import { createAzureStorage } from "./azure.js";
import { createCloudinaryStorage } from "./cloudinary.js";

let cached: StorageProvider | null = null;

// Printed once, at first upload/delete — tells you exactly where files are actually
// going (bucket/container/cloud + folder), since that's the #1 source of "my upload
// succeeded but I can't find the file" confusion when double-checking the wrong place.
function logActiveProvider() {
  if (env.storageProvider === "azure") {
    console.log(`[storage] Using Azure Blob Storage — container "${env.azure!.container}"`);
  } else if (env.storageProvider === "cloudinary") {
    console.log(`[storage] Using Cloudinary — cloud "${env.cloudinary!.cloudName}", folder "${env.cloudinary!.folder}"`);
  } else {
    console.log(`[storage] Using S3 — bucket "${env.s3!.bucket}" at ${env.s3!.endpoint}`);
  }
}

function build(): StorageProvider {
  logActiveProvider();
  if (env.storageProvider === "azure") return createAzureStorage();
  if (env.storageProvider === "cloudinary") return createCloudinaryStorage();
  return createS3Storage();
}

function getStorage(): StorageProvider {
  return (cached ??= build());
}

/** Called once at server boot so the active provider/destination is visible in the
 * logs immediately, rather than only appearing after the first upload. */
export function initStorage(): void {
  getStorage();
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
  return getStorage().upload(key, buffer, contentType);
}

export async function deleteObject(key: string): Promise<void> {
  return getStorage().delete(key);
}
