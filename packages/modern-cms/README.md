# modern-cms

A self-hosted, drag-and-drop website CMS: a Next.js (App Router) front end, an Express + Prisma API, your choice of **PostgreSQL or MySQL**, and pluggable file storage (**AWS S3, Azure Blob Storage, or Cloudinary**). Install it with one command — an interactive wizard scaffolds a complete, working project and writes its `.env` files for you.

- **npm**: <https://www.npmjs.com/package/modern-cms>
- **Source**: <https://github.com/isahaq1/Modern-CMS>
- **Issues**: <https://github.com/isahaq1/Modern-CMS/issues>

## Features

- **Visual page builder** — drag-and-drop containers, a true 2D grid layout (with per-column/row resize), 30+ content blocks (hero, testimonials, pricing tables, video, team, timeline, before/after, and more), responsive breakpoint overrides (desktop/tablet/mobile), GSAP-powered entrance animations, and dark mode.
- **Content model** — pages with draft/publish/scheduled-publish states, page revisions with restore, page templates, collections (blog/news/events/etc.) with locale support, reusable saved blocks, global header/footer sections.
- **Internationalization** — per-page locale + translation groups, RTL layout support, a language switcher block.
- **SEO built in** — sitemap.xml, robots.txt, JSON-LD (WebPage/Article/BreadcrumbList/FAQPage), redirects, per-page meta/OG tags.
- **Auth & governance** — role-based access (Admin / Editor / Author, with per-resource ownership for Authors), an audit log of every mutating admin action.
- **Forms & search** — a contact-form block with submission storage and an optional webhook, full-text search (Postgres `tsvector` ranking) across pages and collection items.
- **Backup** — export/import a single page or the whole site as JSON.
- **Analytics** — GA4, Plausible, or a custom script snippet, configured from the admin theme settings.

## Requirements

- Node.js 18 or newer
- A PostgreSQL or MySQL server (local, Docker, or a managed service)
- Credentials for one file-storage provider: AWS S3 (or any S3-compatible service — MinIO, Cloudflare R2, DigitalOcean Spaces...), Azure Blob Storage, or Cloudinary

## Installation

**npx (no install — always runs the latest version):**

```bash
npx modern-cms
```

**npm (global install):**

```bash
npm install -g modern-cms
modern-cms
```

**yarn:**

```bash
# Yarn Classic (v1)
yarn global add modern-cms
modern-cms

# Yarn Berry (v2+)
yarn dlx modern-cms
```

### What the installer asks

| Step | Prompt | Notes |
|---|---|---|
| 1 | Project directory | Must be empty or not yet exist |
| 2 | Database engine | PostgreSQL or MySQL |
| 3 | Database host / port / name / username / password | Builds `DATABASE_URL` and rewrites the Prisma schema's datasource for you |
| 4 | Web app port / API port | Defaults `3000` / `4000` |
| 5 | Storage provider | AWS S3 (or S3-compatible) / Azure Blob Storage / Cloudinary |
| 6 | Provider credentials | Endpoint/keys/bucket for S3, connection string/container for Azure, cloud name/API key/secret for Cloudinary |
| 7 | Public site URL / API URL | Defaults follow whatever ports you picked |
| 8 | Admin email / password | Leave the password blank to auto-generate one (printed once, at the end) |

The installer only **writes files** — it never runs `npm install`, touches your database, or starts anything. It prints the exact next commands, so nothing happens on your machine without you seeing it first.

### After the wizard finishes

```bash
cd <your-project-dir>
npm install

# PostgreSQL:
npm run db:migrate

# MySQL (the bundled migration history is Postgres-specific SQL, so a fresh
# MySQL install uses schema-push instead of the migration history):
npx prisma generate --schema apps/api/prisma/schema.prisma
npx prisma db push --schema apps/api/prisma/schema.prisma

npm run db:seed
npm run dev
```

Then open the web app at the URL you chose (default `http://localhost:3000`) and log in at `/admin` with the admin email/password from the wizard.

> **Prefer yarn for the scaffolded project too?** `yarn install` works fine, and `dev`/`build`/`db:migrate`/`db:seed` all run correctly. A stray duplicate `@types/express` (pulled in by `@types/multer`'s unpinned `"*"` dependency range) used to break `tsc`/`npm run build` under both npm and yarn — the generated `package.json` now pins it via `overrides` (npm) and `resolutions` (yarn), so a fresh install with either tool is clean.
>
> **Logged in with the wrong password?** The admin user is only created the *first* time `db:seed` runs — editing `.env` afterward doesn't retroactively change it. Run `npm run db:reset-admin && npm run db:seed` to delete and recreate it from the current `.env` values.

## Project layout

The scaffolded project is an npm-workspaces monorepo:

```
your-project/
  apps/
    web/      # Next.js app — public site + /admin builder UI
    api/      # Express + Prisma API
  packages/
    shared/   # Zod schemas, the component registry, and tree helpers shared by both apps
  docker-compose.yml   # optional local Postgres + MinIO for dev
```

## Configuration reference

Everything the installer writes lives in `apps/api/.env` and `apps/web/.env.local`. The full list of variables (and what each one does) is documented in `.env.example` at the root of the scaffolded project.

## Contributing / issues

Bug reports and feature requests are welcome — please open an issue at <https://github.com/isahaq1/Modern-CMS/issues>.

## Author

**Md Isahaq**
Email: [hmisahaq01@gmail.com](mailto:hmisahaq01@gmail.com)
Phone: +880 1852376598

## License

MIT
