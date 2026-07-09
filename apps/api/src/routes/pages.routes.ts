import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  CreatePageInputSchema,
  UpdatePageInputSchema,
  PageNodeSchema,
  createEmptyPage,
  isPagePubliclyVisible,
  extractSearchText,
  cloneWithNewIds,
  type PageNode,
} from "@pgcms/shared";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canModify } from "../middleware/auth.js";
import { pageCacheTags, triggerRevalidation } from "../lib/revalidate.js";

export const pagesRouter = Router();

const MAX_REVISIONS_PER_PAGE = 30;

/** Generates "title (Copy)", "title (Copy 2)", ... and a matching unique slug, used by
 * both /duplicate and template-seeded page creation with a slug clash. */
async function uniqueCopySlug(baseSlug: string): Promise<string> {
  let candidate = `${baseSlug}-copy`;
  let n = 2;
  while (await prisma.page.findUnique({ where: { slug: candidate } })) {
    candidate = `${baseSlug}-copy-${n}`;
    n++;
  }
  return candidate;
}

// Public: list only pages that are actually visible right now (published, and not
// still waiting on a future publishAt).
pagesRouter.get("/public", async (_req, res) => {
  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, status: true, publishAt: true, updatedAt: true, noIndex: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(pages.filter((p) => isPagePubliclyVisible(p) && !p.noIndex));
});

// All publicly-visible members of a page's translation group — the group root is the
// page's translationOfId (or the page itself when it IS the root), and members are the
// root plus everything pointing at it. Query-param based because localized slugs
// contain "/" and would be ambiguous inside a path segment.
pagesRouter.get("/public-translations", async (req, res) => {
  const slug = req.query.slug === "home" || req.query.slug === undefined ? "" : String(req.query.slug);
  const page = await prisma.page.findFirst({ where: { slug } });
  if (!page) return res.json([]);
  const rootId = page.translationOfId ?? page.id;
  const group = await prisma.page.findMany({
    where: { OR: [{ id: rootId }, { translationOfId: rootId }], status: "PUBLISHED" },
    select: { locale: true, slug: true, title: true, status: true, publishAt: true },
  });
  res.json(group.filter(isPagePubliclyVisible).map(({ locale, slug: s, title }) => ({ locale, slug: s, title })));
});

// Wildcard rather than :slug so localized slugs with "/" in them ("es/servicios")
// still resolve as one page path.
pagesRouter.get("/public/*", async (req, res) => {
  const raw = (req.params as Record<string, string>)[0] ?? "";
  const slug = raw === "home" ? "" : raw;
  const page = await prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!page || !isPagePubliclyVisible(page)) return res.status(404).json({ error: "Page not found" });
  res.json(page);
});

// Shareable draft preview — anyone with the secret token can view unpublished content.
pagesRouter.get("/preview/:token", async (req, res) => {
  const page = await prisma.page.findUnique({ where: { previewToken: req.params.token } });
  if (!page) return res.status(404).json({ error: "Preview not found" });
  res.json(page);
});

// Admin: full CRUD
pagesRouter.use(requireAuth);

pagesRouter.get("/", async (_req, res) => {
  const pages = await prisma.page.findMany({ orderBy: { createdAt: "asc" } });
  res.json(pages);
});

pagesRouter.get("/:id", async (req, res) => {
  const page = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json(page);
});

pagesRouter.post("/", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const parsed = CreatePageInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, slug, locale, templateId } = parsed.data;
  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ error: "A page with this slug already exists" });

  let content: PageNode = createEmptyPage();
  if (templateId) {
    const template = await prisma.pageTemplate.findUnique({ where: { id: templateId } });
    if (!template) return res.status(404).json({ error: "Template not found" });
    content = cloneWithNewIds(template.content as unknown as PageNode);
  }

  const page = await prisma.page.create({
    data: {
      title,
      slug,
      status: "DRAFT",
      content: content as any,
      searchText: extractSearchText(content),
      previewToken: nanoid(24),
      createdById: req.user!.sub,
      ...(locale ? { locale } : {}),
    },
  });
  res.status(201).json(page);
});

// Clones an existing page's content under a fresh, auto-suffixed slug — the fastest way
// to start a new page from one that already looks right, or to back up before a risky
// edit. Always created as DRAFT so a duplicate never accidentally goes live.
pagesRouter.post("/:id/duplicate", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const source = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!source) return res.status(404).json({ error: "Page not found" });
  if (!canModify(req.user!, source)) return res.status(403).json({ error: "Forbidden" });

  const slug = await uniqueCopySlug(source.slug || "home");
  const content = cloneWithNewIds(source.content as unknown as PageNode);
  const page = await prisma.page.create({
    data: {
      title: `${source.title} (Copy)`,
      slug,
      status: "DRAFT",
      content: content as any,
      searchText: extractSearchText(content),
      previewToken: nanoid(24),
      locale: source.locale,
      createdById: req.user!.sub,
    },
  });
  res.status(201).json(page);
});

const ImportPageInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9/-]*$/),
  locale: z.string().min(2).max(20).optional(),
  content: PageNodeSchema,
});

// Accepts exactly what /:id/export produces — a slug clash (e.g. re-importing into the
// same site) auto-suffixes rather than erroring, matching /duplicate's behavior.
pagesRouter.post("/import", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const parsed = ImportPageInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const clash = await prisma.page.findUnique({ where: { slug: parsed.data.slug } });
  const slug = clash ? await uniqueCopySlug(parsed.data.slug || "home") : parsed.data.slug;
  const content = cloneWithNewIds(parsed.data.content);

  const page = await prisma.page.create({
    data: {
      title: parsed.data.title,
      slug,
      status: "DRAFT",
      content: content as any,
      searchText: extractSearchText(content),
      previewToken: nanoid(24),
      createdById: req.user!.sub,
      ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
    },
  });
  res.status(201).json(page);
});

// A JSON download of one page's content — for backing it up locally or moving it into
// another pg-cms instance via the import flow.
pagesRouter.get("/:id/export", async (req, res) => {
  const page = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!page) return res.status(404).json({ error: "Page not found" });
  if (!canModify(req.user!, page)) return res.status(403).json({ error: "Forbidden" });
  res.setHeader("Content-Disposition", `attachment; filename="${page.slug || "home"}.page.json"`);
  res.json({ title: page.title, slug: page.slug, locale: page.locale, content: page.content });
});

pagesRouter.put("/:id", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const parsed = UpdatePageInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.slug !== undefined) {
    const clash = await prisma.page.findFirst({
      where: { slug: parsed.data.slug, NOT: { id: req.params.id } },
    });
    if (clash) return res.status(409).json({ error: "A page with this slug already exists" });
  }

  const existing = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Page not found" });
  if (!canModify(req.user!, existing)) return res.status(403).json({ error: "Forbidden" });

  // `publishAt` arrives as whatever a <input type="datetime-local"> produces
  // ("2026-07-04T08:33" — no seconds, no timezone), which Prisma's DateTime field
  // rejects as a raw string. Normalize to a real Date (or null to clear it) before it
  // ever reaches Prisma.
  const data: Record<string, unknown> = { ...parsed.data };
  if ("publishAt" in data) {
    data.publishAt = data.publishAt ? new Date(data.publishAt as string) : null;
  }
  if (parsed.data.content !== undefined) {
    data.searchText = extractSearchText(parsed.data.content);
  }

  try {
    const [page] = await prisma.$transaction([
      prisma.page.update({ where: { id: req.params.id }, data: data as any }),
      // Snapshot the *previous* content on every content-changing save, so "restore"
      // always has something meaningfully different to offer.
      ...(parsed.data.content !== undefined
        ? [
            prisma.pageRevision.create({
              data: { pageId: existing.id, title: existing.title, content: existing.content as any },
            }),
          ]
        : []),
    ]);

    if (parsed.data.content !== undefined) {
      const revisionCount = await prisma.pageRevision.count({ where: { pageId: existing.id } });
      if (revisionCount > MAX_REVISIONS_PER_PAGE) {
        const stale = await prisma.pageRevision.findMany({
          where: { pageId: existing.id },
          orderBy: { createdAt: "asc" },
          take: revisionCount - MAX_REVISIONS_PER_PAGE,
          select: { id: true },
        });
        await prisma.pageRevision.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } });
      }
    }

    const tags = new Set<string>(["cms", "cms-pages", "cms-sitemap"]);
    tags.add(`page:${existing.slug || "home"}`);
    if (parsed.data.slug !== undefined && parsed.data.slug !== existing.slug) {
      tags.add(`page:${parsed.data.slug || "home"}`);
    }
    void triggerRevalidation([...tags]);

    res.json(page);
  } catch (err) {
    // Only Prisma's "record to update not found" (a real 404 — e.g. deleted between
    // our findUnique and the update) should report as 404. Anything else (bad data,
    // a broken query) was previously swallowed into the same misleading 404, which is
    // exactly what hid the publishAt bug above — surface it for real next time.
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      return res.status(404).json({ error: "Page not found" });
    }
    console.error("PUT /api/pages/:id failed:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update page" });
  }
});

pagesRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const existing = await prisma.page.findUnique({ where: { id: req.params.id } });
    await prisma.page.delete({ where: { id: req.params.id } });
    if (existing) void triggerRevalidation(pageCacheTags(existing.slug));
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Page not found" });
  }
});

pagesRouter.get("/:id/revisions", async (req, res) => {
  const revisions = await prisma.pageRevision.findMany({
    where: { pageId: req.params.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, pageId: true, title: true, createdAt: true }, // omit content — list view doesn't need it
  });
  res.json(revisions);
});

pagesRouter.post("/:id/revisions/:revisionId/restore", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const revision = await prisma.pageRevision.findUnique({ where: { id: req.params.revisionId } });
  if (!revision || revision.pageId !== req.params.id) return res.status(404).json({ error: "Revision not found" });

  const current = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: "Page not found" });
  if (!canModify(req.user!, current)) return res.status(403).json({ error: "Forbidden" });

  // Snapshot the current state too, before overwriting — restoring shouldn't be a
  // one-way trip.
  const [page] = await prisma.$transaction([
    prisma.page.update({
      where: { id: req.params.id },
      data: {
        content: revision.content as any,
        searchText: extractSearchText(revision.content as unknown as PageNode),
      },
    }),
    prisma.pageRevision.create({
      data: { pageId: current.id, title: current.title, content: current.content as any },
    }),
  ]);
  void triggerRevalidation(pageCacheTags(current.slug));
  res.json(page);
});

pagesRouter.post("/:id/regenerate-preview-token", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const existing = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Page not found" });
  if (!canModify(req.user!, existing)) return res.status(403).json({ error: "Forbidden" });
  const page = await prisma.page.update({
    where: { id: req.params.id },
    data: { previewToken: nanoid(24) },
  });
  res.json(page);
});
