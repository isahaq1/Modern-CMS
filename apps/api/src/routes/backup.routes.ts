import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { cloneWithNewIds, extractSearchText, PageNodeSchema, type PageNode } from "@pgcms/shared";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const backupRouter = Router();

// Whole-site backup is the most destructive-adjacent feature in the admin — restore is
// additive-only (never overwrites/deletes), but export alone already reveals every
// page's content plus theme/nav/redirect configuration, so both directions are
// ADMIN-only rather than the usual ADMIN/EDITOR pairing.
backupRouter.use(requireAuth, requireRole("ADMIN"));

backupRouter.get("/export", async (_req, res) => {
  const [theme, navItems, pages, collections, globalSections, redirects, savedBlocks, templates] =
    await Promise.all([
      prisma.siteTheme.findFirst(),
      prisma.navItem.findMany(),
      prisma.page.findMany(),
      prisma.collection.findMany({ include: { items: true } }),
      prisma.globalSection.findMany(),
      prisma.redirect.findMany(),
      prisma.savedBlock.findMany(),
      prisma.pageTemplate.findMany(),
    ]);

  res.setHeader("Content-Disposition", `attachment; filename="pg-cms-backup-${Date.now()}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    theme,
    navItems,
    pages,
    collections,
    globalSections,
    redirects,
    savedBlocks,
    templates,
  });
});

const BackupSchema = z.object({
  theme: z.record(z.string(), z.unknown()).nullable().optional(),
  navItems: z.array(z.record(z.string(), z.unknown())).optional(),
  pages: z.array(z.record(z.string(), z.unknown())).optional(),
  collections: z.array(z.record(z.string(), z.unknown())).optional(),
  globalSections: z.array(z.record(z.string(), z.unknown())).optional(),
  redirects: z.array(z.record(z.string(), z.unknown())).optional(),
  savedBlocks: z.array(z.record(z.string(), z.unknown())).optional(),
  templates: z.array(z.record(z.string(), z.unknown())).optional(),
});

type Counts = Record<string, number>;

/** Restores a previously exported bundle additively: an entity is created only if
 * nothing with its natural key already exists, and is otherwise skipped untouched —
 * never overwritten, never deleted. Mirrors the "never destroy user content" rule the
 * builder already follows for column/zone/grid-count shrinks. */
backupRouter.post("/import", async (req, res) => {
  const parsed = BackupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;
  const created: Counts = {};
  const skipped: Counts = {};
  const bump = (bucket: Counts, key: string) => (bucket[key] = (bucket[key] ?? 0) + 1);

  if (data.theme && !(await prisma.siteTheme.findFirst())) {
    const { id: _id, ...rest } = data.theme as Record<string, unknown>;
    await prisma.siteTheme.create({ data: rest as any });
    bump(created, "theme");
  } else if (data.theme) {
    bump(skipped, "theme");
  }

  for (const raw of data.navItems ?? []) {
    const label = String(raw.label ?? "");
    const href = String(raw.href ?? "");
    const exists = await prisma.navItem.findFirst({ where: { label, href } });
    if (exists) {
      bump(skipped, "navItems");
      continue;
    }
    await prisma.navItem.create({
      data: { label, href, order: Number(raw.order) || 0 },
    });
    bump(created, "navItems");
  }

  for (const raw of data.pages ?? []) {
    const slug = String(raw.slug ?? "");
    if (await prisma.page.findUnique({ where: { slug } })) {
      bump(skipped, "pages");
      continue;
    }
    const parsedContent = PageNodeSchema.safeParse(raw.content);
    if (!parsedContent.success) {
      bump(skipped, "pages");
      continue;
    }
    const content: PageNode = cloneWithNewIds(parsedContent.data);
    await prisma.page.create({
      data: {
        title: String(raw.title ?? "Untitled"),
        slug,
        status: "DRAFT",
        content: content as any,
        searchText: extractSearchText(content),
        previewToken: nanoid(24),
        locale: typeof raw.locale === "string" ? raw.locale : "en",
        createdById: req.user!.sub,
      },
    });
    bump(created, "pages");
  }

  for (const rawCollection of data.collections ?? []) {
    const slug = String(rawCollection.slug ?? "");
    if (await prisma.collection.findUnique({ where: { slug } })) {
      bump(skipped, "collections");
      continue;
    }
    const items = Array.isArray(rawCollection.items) ? rawCollection.items : [];
    const collection = await prisma.collection.create({
      data: { name: String(rawCollection.name ?? slug), slug },
    });
    bump(created, "collections");
    for (const rawItem of items as Record<string, unknown>[]) {
      const parsedContent = PageNodeSchema.safeParse(rawItem.content);
      if (!parsedContent.success) continue;
      const content: PageNode = cloneWithNewIds(parsedContent.data);
      await prisma.collectionItem.create({
        data: {
          collectionId: collection.id,
          title: String(rawItem.title ?? "Untitled"),
          slug: String(rawItem.slug ?? nanoid(8)),
          content: content as any,
          searchText: extractSearchText(content),
          locale: typeof rawItem.locale === "string" ? rawItem.locale : "en",
          createdById: req.user!.sub,
        },
      });
      bump(created, "collectionItems");
    }
  }

  for (const raw of data.globalSections ?? []) {
    const kind = String(raw.kind ?? "");
    if (await prisma.globalSection.findUnique({ where: { kind } })) {
      bump(skipped, "globalSections");
      continue;
    }
    const parsedContent = PageNodeSchema.safeParse(raw.content);
    if (!parsedContent.success) {
      bump(skipped, "globalSections");
      continue;
    }
    await prisma.globalSection.create({
      data: { kind, enabled: Boolean(raw.enabled), content: parsedContent.data as any },
    });
    bump(created, "globalSections");
  }

  for (const raw of data.redirects ?? []) {
    const fromPath = String(raw.fromPath ?? "");
    if (await prisma.redirect.findUnique({ where: { fromPath } })) {
      bump(skipped, "redirects");
      continue;
    }
    await prisma.redirect.create({
      data: { fromPath, toPath: String(raw.toPath ?? "/"), permanent: raw.permanent !== false },
    });
    bump(created, "redirects");
  }

  for (const raw of data.savedBlocks ?? []) {
    const name = String(raw.name ?? "");
    if (await prisma.savedBlock.findFirst({ where: { name } })) {
      bump(skipped, "savedBlocks");
      continue;
    }
    const parsedContent = PageNodeSchema.safeParse(raw.content);
    if (!parsedContent.success) {
      bump(skipped, "savedBlocks");
      continue;
    }
    await prisma.savedBlock.create({
      data: { name, content: parsedContent.data as any, createdById: req.user!.sub },
    });
    bump(created, "savedBlocks");
  }

  for (const raw of data.templates ?? []) {
    const name = String(raw.name ?? "");
    if (await prisma.pageTemplate.findFirst({ where: { name } })) {
      bump(skipped, "templates");
      continue;
    }
    const parsedContent = PageNodeSchema.safeParse(raw.content);
    if (!parsedContent.success) {
      bump(skipped, "templates");
      continue;
    }
    await prisma.pageTemplate.create({
      data: {
        name,
        category: typeof raw.category === "string" ? raw.category : "General",
        thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : null,
        content: parsedContent.data as any,
      },
    });
    bump(created, "templates");
  }

  res.json({ created, skipped });
});
