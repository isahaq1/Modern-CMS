import { env } from "../../env.js";
import type { StorageProvider } from "./types.js";
import { createS3Storage } from "./s3.js";
import { createAzureStorage } from "./azure.js";
import { createCloudinaryStorage } from "./cloudinary.js";

let cached: StorageProvider | null = null;

function build(): StorageProvider {
  if (env.storageProvider === "azure") return createAzureStorage();
  if (env.storageProvider === "cloudinary") return createCloudinaryStorage();
  return createS3Storage();
}

function getStorage(): StorageProvider {
  return (cached ??= build());
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
  return getStorage().upload(key, buffer, contentType);
}

export async function deleteObject(key: string): Promise<void> {
  return getStorage().delete(key);
}
