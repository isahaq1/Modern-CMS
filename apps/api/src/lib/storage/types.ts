/** Every storage backend (S3-compatible, Azure Blob, Cloudinary) implements this same
 * shape, so media.routes.ts never has to know which one is active. */
export interface StorageProvider {
  /** Uploads a buffer under `key` and returns the public URL the browser can load it
   * from directly (media assets are never served through a signed-URL proxy today). */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}
