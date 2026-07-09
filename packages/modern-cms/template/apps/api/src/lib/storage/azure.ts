import { BlobServiceClient } from "@azure/storage-blob";
import { env } from "../../env.js";
import type { StorageProvider } from "./types.js";

export function createAzureStorage(): StorageProvider {
  const config = env.azure!;
  const serviceClient = BlobServiceClient.fromConnectionString(config.connectionString);
  const containerClient = serviceClient.getContainerClient(config.container);

  function publicUrlFor(key: string) {
    if (config.publicUrl) return `${config.publicUrl}/${key}`;
    return containerClient.getBlockBlobClient(key).url;
  }

  return {
    async upload(key, buffer, contentType) {
      const blockBlobClient = containerClient.getBlockBlobClient(key);
      await blockBlobClient.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } });
      return publicUrlFor(key);
    },
    async delete(key) {
      await containerClient.getBlockBlobClient(key).deleteIfExists();
    },
  };
}
