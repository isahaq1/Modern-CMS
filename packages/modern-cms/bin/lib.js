import crypto from "node:crypto";

export function randomSecret() {
  return crypto.randomBytes(48).toString("hex");
}

export function buildDatabaseUrl(db) {
  const protocol = db.engine === "mysql" ? "mysql" : "postgresql";
  return `${protocol}://${encodeURIComponent(db.user)}:${encodeURIComponent(db.password)}@${db.host}:${db.port}/${db.name}`;
}

export function rewriteSchemaProvider(schemaContent, engine) {
  return schemaContent.replace(/provider\s*=\s*"postgresql"/, `provider = "${engine}"`);
}

/** MySQL can't run the bundled migration history — it's raw SQL generated for
 * PostgreSQL. There's no existing data on a fresh install, so dropping the history and
 * using `prisma db push` instead of `prisma migrate dev` is the correct, simplest path. */
export function usesDbPush(engine) {
  return engine === "mysql";
}

export function buildStorageEnvLines(provider, values) {
  if (provider === "s3") {
    return [
      `S3_ENDPOINT=${values.endpoint}`,
      `S3_REGION=${values.region}`,
      `S3_ACCESS_KEY_ID=${values.accessKeyId}`,
      `S3_SECRET_ACCESS_KEY=${values.secretAccessKey}`,
      `S3_BUCKET=${values.bucket}`,
      `S3_PUBLIC_URL=${values.publicUrl}`,
      `S3_FORCE_PATH_STYLE=${String(values.forcePathStyle)}`,
    ];
  }
  if (provider === "azure") {
    return [
      `AZURE_STORAGE_CONNECTION_STRING=${values.connectionString}`,
      `AZURE_STORAGE_CONTAINER=${values.container}`,
      ...(values.publicUrl ? [`AZURE_STORAGE_PUBLIC_URL=${values.publicUrl}`] : []),
    ];
  }
  return [
    `CLOUDINARY_CLOUD_NAME=${values.cloudName}`,
    `CLOUDINARY_API_KEY=${values.apiKey}`,
    `CLOUDINARY_API_SECRET=${values.apiSecret}`,
    `CLOUDINARY_FOLDER=${values.folder}`,
  ];
}

export function buildApiEnv({ databaseUrl, jwtSecret, adminEmail, adminPassword, storageProvider, storageEnvLines, siteUrl, revalidateSecret }) {
  return [
    `DATABASE_URL=${databaseUrl}`,
    "",
    "# --- Auth ---",
    `JWT_SECRET=${jwtSecret}`,
    "JWT_EXPIRES_IN=7d",
    "COOKIE_NAME=pgcms_token",
    "",
    "# --- Seed admin user ---",
    `SEED_ADMIN_EMAIL=${adminEmail}`,
    `SEED_ADMIN_PASSWORD=${adminPassword}`,
    "",
    `# --- File storage (${storageProvider}) ---`,
    `STORAGE_PROVIDER=${storageProvider}`,
    ...storageEnvLines,
    "",
    "# --- API ---",
    "API_PORT=4000",
    `WEB_ORIGIN=${siteUrl}`,
    "",
    "# --- Cache revalidation ---",
    `REVALIDATE_URL=${siteUrl}`,
    `REVALIDATE_SECRET=${revalidateSecret}`,
    "",
    "# --- Form integrations (optional) ---",
    "FORMS_WEBHOOK_URL=",
    "",
  ].join("\n");
}

export function buildWebEnv({ apiUrl, siteUrl }) {
  return [`API_URL=${apiUrl}`, `SITE_URL=${siteUrl}`, ""].join("\n");
}

export function buildRootEnv({ db, databaseUrl, storageProvider, storageEnvLines }) {
  const s3Line = (prefix) => storageEnvLines.find((l) => l.startsWith(prefix));
  return [
    `POSTGRES_USER=${db.user}`,
    `POSTGRES_PASSWORD=${db.password}`,
    `POSTGRES_DB=${db.name}`,
    `DATABASE_URL=${databaseUrl}`,
    ...(storageProvider === "s3"
      ? [s3Line("S3_ACCESS_KEY_ID="), s3Line("S3_SECRET_ACCESS_KEY="), s3Line("S3_BUCKET=")].filter(Boolean)
      : []),
    "",
  ].join("\n");
}
