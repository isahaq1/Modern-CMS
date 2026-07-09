# modern-cms

A self-hosted, drag-and-drop website CMS — Next.js (App Router) front end, Express + Prisma API, PostgreSQL or MySQL, and pluggable file storage (AWS S3, Azure Blob Storage, or Cloudinary).

## Quick start

```
npx modern-cms
```

You'll be asked for:

- Where to create the project
- Database engine (PostgreSQL or MySQL) — host, database name, username, password
- File storage provider (AWS S3 / any S3-compatible service, Azure Blob Storage, or Cloudinary) and its credentials
- Site URLs and an admin login

The installer scaffolds the full project into your target directory and writes working `.env` files for the API and web app. It does **not** run `npm install` or touch your database for you — it prints the exact next commands to run, so nothing happens on your machine without you seeing it first.

## What you get

- A visual, drag-and-drop page builder (containers, grids, 30+ content blocks, responsive breakpoints, animations, dark mode)
- Collections (blog/news/etc.), full-text search, SEO (sitemap, JSON-LD, redirects), page revisions and templates
- Role-based auth (Admin / Editor / Author), audit log, form submissions
- Media library backed by whichever storage provider you chose

## After setup

```
cd <your-project-dir>
npm install
npm run db:migrate   # PostgreSQL
# or, for MySQL (the bundled migration history is Postgres-specific SQL):
npx prisma db push --schema apps/api/prisma/schema.prisma
npm run db:seed
npm run dev
```

## License

MIT
