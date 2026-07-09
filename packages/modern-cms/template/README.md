# pg-cms

A self-hosted, drag-and-drop website CMS. Build every page of a site visually — drag sections onto a canvas, edit their content and style in an inspector panel, animate them, and publish. The public site and the builder canvas render through the same React components, so what you see while editing is exactly what visitors get.

Built as an npm-workspaces monorepo:

| Workspace | What it is |
|---|---|
| `apps/web` | Next.js 14 (App Router) — the public site **and** the `/admin` builder UI |
| `apps/api` | Express + Prisma + PostgreSQL — auth, pages, media, theme, forms |
| `packages/shared` | Zod schemas, the component registry, and page-tree helpers shared by both |

---

## Quick start

### Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL + MinIO)

### 1. Start the databases

```bash
npm run docker:up
```

This starts:

| Service | Host port | Notes |
|---|---|---|
| PostgreSQL 16 | **5434** | container port 5432; 5434 chosen to avoid clashing with other local Postgres instances |
| MinIO (S3 API) | **9010** | media file storage |
| MinIO console | **9011** | web UI for browsing the bucket |

A one-shot init container creates the `pgcms-media` bucket automatically.

> **Port conflicts:** if `docker compose up` fails with "port is already allocated", another container or service owns that port — run `docker ps` to find it, then either stop it or change the host-side port in `docker-compose.yml` **and** the matching URLs in `apps/api/.env`.

### 2. Environment files

Two env files are used:

- **Repo root `.env`** — read by `docker-compose.yml` (Postgres user/password/db name, MinIO keys).
- **`apps/api/.env`** — read by the API and Prisma (`DATABASE_URL`, JWT, S3, seed admin).

Copy the example and adjust if needed:

```bash
cp .env.example .env
cp .env.example apps/api/.env   # then trim to the API-relevant keys, or keep all
```

**Important:** the password inside `DATABASE_URL` in `apps/api/.env` must match `POSTGRES_PASSWORD` in the root `.env`. Postgres sets its password the *first* time its data volume is created — changing `.env` later does not change the database password.

### 3. Install, migrate, seed

```bash
npm install
npm run db:migrate     # applies Prisma migrations
npm run db:seed        # creates the admin user, default theme, and a sample home page
```

Optional demo content (a full multi-section homepage and an extra page):

```bash
cd apps/api
npx tsx prisma/seed-homepage.ts
npx tsx prisma/seed-our-charities.ts
```

### 4. Run the dev servers

```bash
npm run dev            # API (port 4000) + web (port 3000) together
# or separately:
npm run dev:api
npm run dev:web
```

### 5. Log in

| URL | What |
|---|---|
| http://localhost:3000 | Public site |
| http://localhost:3000/admin/login | Admin builder |

**Default example credentials** (from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `apps/api/.env`):

```
Email:    admin@example.com
Password: ChangeMe123!
```

> Change these before deploying anywhere real. The seed only sets the password when the user is first created — to change it later, update the env values, delete the user row, and re-run `npm run db:seed` (or update the password through the admin Users page).

---

## Features

### Page builder

- **Drag & drop** — drag components from the palette onto the canvas, reorder by dragging, nest inside containers/columns.
- **Live canvas** — pages render with the same components as the public site; select any section to edit it.
- **Inspector panel** — per-component **Content** tab (fields auto-generated from the component registry) and **Style** tab organized into collapsible groups: Basics, Border, Shadow & Opacity, Animation, Modern Effects, Advanced.
- **Drag-to-resize** — pull the right/bottom edge handles of a selected section to set its width/height; columns resize their real CSS Grid tracks.
- **Breadcrumb selection** — when a container is fully covered by its children, use the breadcrumb at the top of the Inspector to select the parent.
- **Undo / redo** — Ctrl+Z / Ctrl+Y, with rapid edits coalesced into single history steps.
- **Autosave & draft recovery** — periodic local backup with a restore prompt if the browser closes mid-edit.
- **Revisions** — every save snapshots the previous version (last 30 kept); restore from Page Settings → History.
- **Scheduled publishing** — set a future publish date; the page stays hidden until then.
- **Show/hide** — non-destructively hide any section from the live site while keeping it in the builder.
- **Developer mode** — the `</>` toggle in the Inspector reveals a raw JSON tab for editing any node's props/style directly.

### Components (22+)

Layout: Header (3-zone with logo/nav/buttons), Footer (link columns, contact info, socials), Columns/Container.
Content: Hero, Rich Text (full toolbar: headings, lists, alignment, colors, links, quotes), Card Grid (image or icon tiles), Accordion/FAQ, Tabs (animated switching), Stats (count-up numbers), CTA, Countdown, Marquee/Ticker.
Media: Image, Image Slider, Image/Video Background sections, 3D Background, Gallery.
Interactive: Buttons, Map, Contact Form (submissions stored and viewable in the admin).

### Animation system (GSAP)

Every section of any type can animate — configured entirely in the Inspector:

- **12 entrance effects** — fade, slide (4 directions), zoom, rotate, pulse, scroll-reveal, blur, flip, bounce.
- **5 triggers** — on load, on scroll into view, on hover (reverses on leave), on focus, on click (plays a full tap gesture).
- **Customization** — duration, delay, easing presets (smooth / overshoot / elastic / bounce / custom GSAP string), continuous loop.
- **Stagger** — reveal a section's inner items (cards, paragraphs, buttons) one after another.
- **Parallax** — sections drift against the scroll at a configurable speed.

### Modern effects

- **Hover effects** — lift, 3D tilt (follows the pointer), glow, scale.
- **Glassmorphism** — one-click frosted-glass panels.
- **Gradient headings** — fill a section's headings with a two-color gradient.
- **Animated gradients** — hero backgrounds that slowly sweep their colors.

### 3D backgrounds (Three.js)

Six scene presets usable in the Hero or the dedicated 3D Background component: **Particles, Waves, Floating Shapes, Starfield, Network/Constellation, Orbit Rings** — each with two colors, density, speed, opacity, an on/off switch, and optional pointer-follow camera parallax. Three.js is lazy-loaded only on pages that actually use it, and all motion respects `prefers-reduced-motion`.

### Site-wide

- **Theme settings** — brand colors, fonts, logo applied via CSS variables everywhere.
- **Navigation editor** — menu items with dropdown submenus.
- **Media library** — uploads stored in MinIO/S3; image/video pickers throughout the builder.
- **Form submissions** — public forms POST to the API; view/delete entries in the admin.
- **SEO** — per-page title, description, and OG image.
- **Escape hatches** — arbitrary custom CSS properties and HTML attributes (`data-*`, `aria-*`, `id`) on any section.

---

## Scripts reference

| Command | What it does |
|---|---|
| `npm run dev` | API + web dev servers together |
| `npm run dev:api` / `npm run dev:web` | Each dev server alone |
| `npm run build` | Build shared → api → web for production |
| `npm run docker:up` / `npm run docker:down` | Start / stop Postgres + MinIO |
| `npm run db:migrate` | Apply Prisma migrations (`prisma migrate dev`) |
| `npm run db:seed` | Seed admin user, theme, sample page |

---

## Project structure

```
pg-cms/
  docker-compose.yml          # Postgres (5434) + MinIO (9010/9011)
  .env / .env.example         # compose-level env
  packages/shared/src/
    schema/                   # Zod schemas: PageNode, NodeStyle, User, Theme, fields
    components.ts             # THE component registry — one entry per block type
    tree.ts                   # pure page-tree helpers (insert/move/remove/create)
  apps/api/
    .env                      # DATABASE_URL, JWT, S3, seed admin credentials
    prisma/                   # schema, migrations, seed scripts
    src/routes/               # auth, pages, media, theme, users, forms
  apps/web/
    app/[[...slug]]/          # public site — renders published pages
    app/admin/                # login, dashboard, builder, media, settings
    components/renderer/      # Renderer + one component per block type
    components/builder/       # Palette, Canvas, Inspector, field editors
    lib/                      # style mapping, GSAP hooks, Three.js scenes
```

### Adding a new component type

1. Add a `ComponentDefinition` to `packages/shared/src/components.ts` (type, label, icon, default props/style, Inspector fields).
2. Create the React component in `apps/web/components/renderer/sections/`.
3. Register it in `apps/web/components/renderer/registry.tsx`.

No builder-chrome changes needed — the palette, inspector, and drag-and-drop pick it up from the registry.

---

## Troubleshooting

**`P1010: User was denied access` on migrate** — the `DATABASE_URL` password doesn't match what Postgres was initialized with, *or* you're accidentally connecting to a different Postgres on the same port (check `docker ps` for other projects' containers).

**`port is already allocated` from Docker** — another container owns the host port. `docker ps`, then stop it or change the port mapping in `docker-compose.yml` + the URLs in `apps/api/.env`.

**"Invalid email or password"** — credentials are case-sensitive; watch for browser autofill inserting a stale saved password. The current values live in `apps/api/.env`.

**Prisma `EPERM ... query_engine ... .dll.node` on Windows** — the running API dev server is holding the engine file. Stop it (`netstat -ano | findstr :4000`, then kill that PID), run the migration, restart.

**Dev server "running" but serving stale code** — an orphaned process may still own the port. Verify with `netstat -ano | findstr :3000` (or `:4000`) and kill the listed PID before restarting.
