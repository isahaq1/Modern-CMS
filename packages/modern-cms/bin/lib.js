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

/** dotenv treats `#` as a start-of-comment marker on unquoted values (so a password
 * like "Adm!n#2024" silently truncates to "Adm!n" — confirmed by testing dotenv.parse
 * directly) and trims unquoted trailing whitespace. Wrapping every value in double
 * quotes fixes both.
 *
 * Backslashes and embedded quotes need escaping too — dotenv's matcher stops at the
 * first *unescaped* `"`, so a literal quote in the value would end the match early and
 * corrupt everything after it on that line (confirmed against dotenv's own source:
 * lib/main.js's LINE regex uses `(?:\\"|[^"])*` for double-quoted values). Note dotenv
 * itself never un-escapes `\"`/`\\` back out on the read side (only `\n`/`\r` get
 * expanded) — so a value containing a literal backslash or quote character can't be
 * perfectly round-tripped by any quoting strategy; escaping still prevents the much
 * worse failure (truncation/corrupted file), it just means those two specific
 * characters aren't recommended in a password if byte-for-byte fidelity matters. */
function quoteEnvValue(value) {
  const str = String(value ?? "");
  return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function envLine(key, value) {
  return `${key}=${quoteEnvValue(value)}`;
}

export function buildStorageEnvLines(provider, values) {
  if (provider === "s3") {
    return [
      envLine("S3_ENDPOINT", values.endpoint),
      envLine("S3_REGION", values.region),
      envLine("S3_ACCESS_KEY_ID", values.accessKeyId),
      envLine("S3_SECRET_ACCESS_KEY", values.secretAccessKey),
      envLine("S3_BUCKET", values.bucket),
      envLine("S3_PUBLIC_URL", values.publicUrl),
      envLine("S3_FORCE_PATH_STYLE", String(values.forcePathStyle)),
    ];
  }
  if (provider === "azure") {
    return [
      envLine("AZURE_STORAGE_CONNECTION_STRING", values.connectionString),
      envLine("AZURE_STORAGE_CONTAINER", values.container),
      ...(values.publicUrl ? [envLine("AZURE_STORAGE_PUBLIC_URL", values.publicUrl)] : []),
    ];
  }
  return [
    envLine("CLOUDINARY_CLOUD_NAME", values.cloudName),
    envLine("CLOUDINARY_API_KEY", values.apiKey),
    envLine("CLOUDINARY_API_SECRET", values.apiSecret),
    envLine("CLOUDINARY_FOLDER", values.folder),
  ];
}

export function buildApiEnv({ databaseUrl, jwtSecret, adminEmail, adminPassword, storageProvider, storageEnvLines, siteUrl, apiPort, revalidateSecret }) {
  return [
    envLine("DATABASE_URL", databaseUrl),
    "",
    "# --- Auth ---",
    envLine("JWT_SECRET", jwtSecret),
    envLine("JWT_EXPIRES_IN", "7d"),
    envLine("COOKIE_NAME", "pgcms_token"),
    "",
    "# --- Seed admin user ---",
    envLine("SEED_ADMIN_EMAIL", adminEmail),
    envLine("SEED_ADMIN_PASSWORD", adminPassword),
    "",
    `# --- File storage (${storageProvider}) ---`,
    envLine("STORAGE_PROVIDER", storageProvider),
    ...storageEnvLines,
    "",
    "# --- API ---",
    envLine("API_PORT", apiPort),
    envLine("WEB_ORIGIN", siteUrl),
    "",
    "# --- Cache revalidation ---",
    envLine("REVALIDATE_URL", siteUrl),
    envLine("REVALIDATE_SECRET", revalidateSecret),
    "",
    "# --- Form integrations (optional) ---",
    "FORMS_WEBHOOK_URL=",
    "",
  ].join("\n");
}

export function buildWebEnv({ apiUrl, siteUrl, webPort }) {
  return [envLine("API_URL", apiUrl), envLine("SITE_URL", siteUrl), envLine("PORT", webPort), ""].join("\n");
}

export function buildRootEnv({ db, databaseUrl, storageProvider, storageEnvLines }) {
  const s3Line = (prefix) => storageEnvLines.find((l) => l.startsWith(prefix));
  return [
    envLine("POSTGRES_USER", db.user),
    envLine("POSTGRES_PASSWORD", db.password),
    envLine("POSTGRES_DB", db.name),
    envLine("DATABASE_URL", databaseUrl),
    ...(storageProvider === "s3"
      ? [s3Line("S3_ACCESS_KEY_ID="), s3Line("S3_SECRET_ACCESS_KEY="), s3Line("S3_BUCKET=")].filter(Boolean)
      : []),
    "",
  ].join("\n");
}
