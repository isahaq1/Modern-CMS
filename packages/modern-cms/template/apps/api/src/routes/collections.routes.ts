import { Router } from "express";
import {
  CreateCollectionInputSchema,
  CreateCollectionItemInputSchema,
  UpdateCollectionItemInputSchema,
  createEmptyPage,
  extractSearchText,
  type PageNode,
} from "@pgcms/shared";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole, canModify } from "../middleware/auth.js";
import { triggerRevalidation } from "../lib/revalidate.js";

export const collectionsRouter = Router();

// --- Public reads (no auth) ---

// Newest-first published items of a collection — powers the "Collection List" block.
collectionsRouter.get("/public/:slug/items", async (req, res) => {
  const collection = await prisma.collection.findUnique({ where: { slug: req.params.slug } });
  if (!collection) return res.status(404).json({ error: "Collection not found" });
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const items = await prisma.collectionItem.findMany({
    where: { collectionId: collection.id, status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: { slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true },
  });
  res.json(items);
});

collectionsRouter.get("/public/:slug/items/:itemSlug", async (req, res) => {
  const collection = await prisma.collection.findUnique({ where: { slug: req.params.slug } });
  if (!collection) return res.status(404).json({ error: "Not found" });
  const item = await prisma.collectionItem.findFirst({
    where: { collectionId: collection.id, slug: req.params.itemSlug, status: "PUBLISHED" },
  });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ ...item, collectionSlug: collection.slug, collectionName: collection.name });
});

// All publicly-visible members of an item's translation group, mirroring
// pages.routes.ts's /public-translations — the group root is the item's
// translationOfId (or the item itself when it IS the root), scoped to items within the
// same collection since a "translation of" only makes sense there.
collectionsRouter.get("/public/:slug/items/:itemSlug/translations", async (req, res) => {
  const collection = await prisma.collection.findUnique({ where: { slug: req.params.slug } });
  if (!collection) return res.json([]);
  const item = await prisma.collectionItem.findFirst({
    where: { collectionId: collection.id, slug: req.params.itemSlug },
  });
  if (!item) return res.json([]);
  const rootId = item.translationOfId ?? item.id;
  const group = await prisma.collectionItem.findMany({
    where: {
      collectionId: collection.id,
      OR: [{ id: rootId }, { translationOfId: rootId }],
      status: "PUBLISHED",
    },
    select: { locale: true, slug: true, title: true },
  });
  res.json(group.map(({ locale, slug, title }) => ({ locale, slug: `${collection.slug}/${slug}`, title })));
});

// Everything the sitemap needs in one call: all published item URLs.
collectionsRouter.get("/public-sitemap", async (_req, res) => {
  const items = await prisma.collectionItem.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, collection: { select: { slug: true } } },
  });
  res.json(items.map((i) => ({ path: `${i.collection.slug}/${i.slug}`, updatedAt: i.updatedAt })));
});

// --- Admin CRUD ---
collectionsRouter.use(requireAuth);

collectionsRouter.get("/", async (_req, res) => {
  const collections = await prisma.collection.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { items: true } } },
  });
  res.json(collections);
});

collectionsRouter.post("/", requireRole("ADMIN", "EDITOR"), async (req, res) => {
  const parsed = CreateCollectionInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const clash = await prisma.collection.findUnique({ where: { slug: parsed.data.slug } });
  if (clash) return res.status(409).json({ error: "A collection with this slug already exists" });
  const collection = await prisma.collection.create({ data: parsed.data });
  res.status(201).json(collection);
});

collectionsRouter.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.collection.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Collection not found" });
  }
});

collectionsRouter.get("/:id/items", async (req, res) => {
  const items = await prisma.collectionItem.findMany({
    where: { collectionId: req.params.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      locale: true,
      translationOfId: true,
    },
  });
  res.json(items);
});

collectionsRouter.post("/:id/items", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const parsed = CreateCollectionItemInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const clash = await prisma.collectionItem.findFirst({
    where: { collectionId: req.params.id, slug: parsed.data.slug },
  });
  if (clash) return res.status(409).json({ error: "An item with this slug already exists in this collection" });
  const item = await prisma.collectionItem.create({
    data: {
      collectionId: req.params.id,
      title: parsed.data.title,
      slug: parsed.data.slug,
      content: createEmptyPage() as object,
      createdById: req.user!.sub,
      ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
    },
  });
  res.status(201).json(item);
});

collectionsRouter.get("/items/:itemId", async (req, res) => {
  const item = await prisma.collectionItem.findUnique({
    where: { id: req.params.itemId },
    include: { collection: { select: { name: true, slug: true } } },
  });
  if (!item) return res.status(404).json({ error: "Item not found" });
  res.json(item);
});

collectionsRouter.put("/items/:itemId", requireRole("ADMIN", "EDITOR", "AUTHOR"), async (req, res) => {
  const parsed = UpdateCollectionItemInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existingForOwnership = await prisma.collectionItem.findUnique({ where: { id: req.params.itemId } });
  if (!existingForOwnership) return res.status(404).json({ error: "Item not found" });
  if (!canModify(req.user!, existingForOwnership)) return res.status(403).json({ error: "Forbidden" });

  const data: Record<string, unknown> = { ...parsed.data };
  // First publish stamps publishedAt (the list sort key); republish keeps the original.
  if (parsed.data.status === "PUBLISHED" && !existingForOwnership.publishedAt) {
    data.publishedAt = new Date();
  }
  if (parsed.data.content !== undefined) {
    data.searchText = extractSearchText(parsed.data.content as PageNode);
  }

  try {
    const item = await prisma.collectionItem.update({ where: { id: req.params.itemId }, data: data as never });
    if (parsed.data.status === "PUBLISHED" || parsed.data.content !== undefined) {
      void triggerRevalidation(["cms", "cms-sitemap", `collection:${item.collectionId}`]);
    }
    res.json(item);
  } catch {
    res.status(404).json({ error: "Item not found" });
  }
});

collectionsRouter.delete("/items/:itemId", requireRole("ADMIN", "EDITOR"), async (req, res) => {
  try {
    await prisma.collectionItem.delete({ where: { id: req.params.itemId } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Item not found" });
  }
});
