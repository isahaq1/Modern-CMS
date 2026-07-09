import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export type StorageProviderName = "s3" | "azure" | "cloudinary";

// Defaults to "s3" so every install that predates this setting (no STORAGE_PROVIDER in
// its .env) keeps behaving exactly as before, unchanged.
const storageProvider = (process.env.STORAGE_PROVIDER || "s3") as StorageProviderName;

function s3Config() {
  return {
    endpoint: required("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "us-east-1",
    accessKeyId: required("S3_ACCESS_KEY_ID"),
    secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    bucket: required("S3_BUCKET"),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    publicUrl: required("S3_PUBLIC_URL"),
  };
}

function azureConfig() {
  return {
    connectionString: required("AZURE_STORAGE_CONNECTION_STRING"),
    container: required("AZURE_STORAGE_CONTAINER"),
    // Optional — set when serving through a CDN/custom domain instead of the storage
    // account's own blob endpoint. Unset falls back to the blob client's own .url.
    publicUrl: process.env.AZURE_STORAGE_PUBLIC_URL,
  };
}

function cloudinaryConfig() {
  return {
    cloudName: required("CLOUDINARY_CLOUD_NAME"),
    apiKey: required("CLOUDINARY_API_KEY"),
    apiSecret: required("CLOUDINARY_API_SECRET"),
    folder: process.env.CLOUDINARY_FOLDER || "pgcms",
  };
}

export const env = {
  port: Number(process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "pgcms_token",
  // Only the selected provider's vars are actually required — an S3 install is never
  // forced to set Azure/Cloudinary credentials, and vice versa (see lib/storage/).
  storageProvider,
  s3: storageProvider === "s3" ? s3Config() : undefined,
  azure: storageProvider === "azure" ? azureConfig() : undefined,
  cloudinary: storageProvider === "cloudinary" ? cloudinaryConfig() : undefined,
  formsWebhookUrl: process.env.FORMS_WEBHOOK_URL,
  revalidateUrl: process.env.REVALIDATE_URL,
  revalidateSecret: process.env.REVALIDATE_SECRET,
};
