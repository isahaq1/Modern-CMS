#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import {
  randomSecret,
  buildDatabaseUrl,
  rewriteSchemaProvider,
  usesDbPush,
  buildStorageEnvLines,
  buildApiEnv,
  buildWebEnv,
  buildRootEnv,
} from "./lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, "..", "template");

// npm's packlist strips any file literally named ".gitignore" out of the published
// tarball, so the template ships it as "gitignore" — restore the leading dot on scaffold.
function destName(name) {
  return name === "gitignore" ? ".gitignore" : name;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, destName(entry.name));
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function onCancel() {
  console.log("\nSetup cancelled — nothing was written.");
  process.exit(1);
}

async function main() {
  console.log("\n🚀 modern-cms — self-hosted drag-and-drop website CMS\n");

  const { targetDir } = await prompts(
    { type: "text", name: "targetDir", message: "📁 Where should the project be created?", initial: "./modern-cms-app" },
    { onCancel }
  );
  const dest = path.resolve(process.cwd(), targetDir);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    console.error(`\n"${dest}" already exists and isn't empty. Choose an empty or new directory.`);
    process.exit(1);
  }

  console.log(`\n📦 Copying project files into ${dest} ...`);
  copyDir(TEMPLATE_DIR, dest);

  // --- Database ---
  console.log("\n🗄️  Database");
  const db = await prompts(
    [
      {
        type: "select",
        name: "engine",
        message: "Database engine",
        choices: [
          { title: "🐘 PostgreSQL", value: "postgresql" },
          { title: "🐬 MySQL", value: "mysql" },
        ],
      },
      { type: "text", name: "host", message: "Database host", initial: "localhost" },
      {
        type: "text",
        name: "port",
        message: "Database port",
        initial: (_, values) => (values.engine === "mysql" ? "3306" : "5432"),
      },
      { type: "text", name: "name", message: "Database name", initial: "modern_cms" },
      { type: "text", name: "user", message: "Database username", initial: (_, values) => (values.engine === "mysql" ? "root" : "postgres") },
      { type: "password", name: "password", message: "Database password" },
    ],
    { onCancel }
  );

  const databaseUrl = buildDatabaseUrl(db);

  const schemaPath = path.join(dest, "apps/api/prisma/schema.prisma");
  fs.writeFileSync(schemaPath, rewriteSchemaProvider(fs.readFileSync(schemaPath, "utf8"), db.engine));

  if (usesDbPush(db.engine)) {
    const migrationsDir = path.join(dest, "apps/api/prisma/migrations");
    if (fs.existsSync(migrationsDir)) fs.rmSync(migrationsDir, { recursive: true, force: true });
  }

  // --- Ports ---
  console.log("\n🔌 Ports");
  const ports = await prompts(
    [
      { type: "text", name: "webPort", message: "Web app port", initial: "3000" },
      { type: "text", name: "apiPort", message: "API port", initial: "4000" },
    ],
    { onCancel }
  );

  // --- Storage ---
  console.log("\n☁️  File storage");
  const { provider } = await prompts(
    {
      type: "select",
      name: "provider",
      message: "Storage provider",
      choices: [
        { title: "🪣 AWS S3 (or any S3-compatible: MinIO, R2, Spaces...)", value: "s3" },
        { title: "🔷 Azure Blob Storage", value: "azure" },
        { title: "🌤️  Cloudinary", value: "cloudinary" },
      ],
    },
    { onCancel }
  );

  let storageValues;
  if (provider === "s3") {
    storageValues = await prompts(
      [
        { type: "text", name: "endpoint", message: "S3 endpoint", initial: "https://s3.amazonaws.com" },
        { type: "text", name: "region", message: "S3 region", initial: "us-east-1" },
        { type: "text", name: "accessKeyId", message: "S3 access key ID" },
        { type: "password", name: "secretAccessKey", message: "S3 secret access key" },
        { type: "text", name: "bucket", message: "S3 bucket name" },
        { type: "text", name: "publicUrl", message: "Public base URL for uploaded files (e.g. https://<bucket>.s3.amazonaws.com)" },
        {
          type: "toggle",
          name: "forcePathStyle",
          message: "Force path-style URLs? (needed for MinIO/most non-AWS S3-compatible services)",
          initial: false,
          active: "yes",
          inactive: "no",
        },
      ],
      { onCancel }
    );
  } else if (provider === "azure") {
    storageValues = await prompts(
      [
        { type: "password", name: "connectionString", message: "Azure Storage connection string" },
        { type: "text", name: "container", message: "Blob container name", initial: "media" },
        { type: "text", name: "publicUrl", message: "Public base URL (leave blank to use the storage account's own blob URL)", initial: "" },
      ],
      { onCancel }
    );
  } else {
    storageValues = await prompts(
      [
        { type: "text", name: "cloudName", message: "Cloudinary cloud name" },
        { type: "text", name: "apiKey", message: "Cloudinary API key" },
        { type: "password", name: "apiSecret", message: "Cloudinary API secret" },
        { type: "text", name: "folder", message: "Upload folder", initial: "pgcms" },
      ],
      { onCancel }
    );
  }
  const storageEnvLines = buildStorageEnvLines(provider, storageValues);

  // --- Site / admin (necessary extras beyond what was asked for: the app needs to
  // know its own public URLs, and the CMS needs an initial admin login) ---
  console.log("\n👤 Site & admin account");
  const site = await prompts(
    [
      { type: "text", name: "siteUrl", message: "Public site URL", initial: `http://localhost:${ports.webPort}` },
      { type: "text", name: "apiUrl", message: "API URL", initial: `http://localhost:${ports.apiPort}` },
      { type: "text", name: "adminEmail", message: "Admin login email", initial: "admin@example.com" },
      { type: "password", name: "adminPassword", message: "Admin login password (leave blank to generate one)" },
    ],
    { onCancel }
  );
  const adminPassword = site.adminPassword || crypto.randomBytes(9).toString("base64url");

  const apiEnv = buildApiEnv({
    databaseUrl,
    jwtSecret: randomSecret(),
    adminEmail: site.adminEmail,
    adminPassword,
    storageProvider: provider,
    storageEnvLines,
    siteUrl: site.siteUrl,
    apiPort: ports.apiPort,
    revalidateSecret: randomSecret(),
  });
  const webEnv = buildWebEnv({ apiUrl: site.apiUrl, siteUrl: site.siteUrl, webPort: ports.webPort });
  const rootEnv = buildRootEnv({ db, databaseUrl, storageProvider: provider, storageEnvLines });

  fs.writeFileSync(path.join(dest, "apps/api/.env"), apiEnv);
  fs.writeFileSync(path.join(dest, "apps/web/.env.local"), webEnv);
  fs.writeFileSync(path.join(dest, ".env"), rootEnv);

  if (!site.adminPassword) {
    console.log(`\n🔑 Generated admin password: ${adminPassword}\n   (save this — it's only shown once)`);
  }

  console.log("\n✅ Done! Generated .env files for apps/api and apps/web.\n");
  console.log("👉 Next steps:");
  console.log(`  cd ${targetDir}`);
  console.log("  npm install");
  if (usesDbPush(db.engine)) {
    console.log("  npx prisma generate --schema apps/api/prisma/schema.prisma");
    console.log("  npx prisma db push --schema apps/api/prisma/schema.prisma");
    console.log("    (MySQL installs use db push instead of migrate — the bundled migration history is Postgres-specific SQL)");
  } else {
    console.log("  npm run db:migrate");
  }
  console.log("  npm run db:seed");
  console.log("  npm run dev\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
