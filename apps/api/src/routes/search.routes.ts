import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { isPagePubliclyVisible } from "@pgcms/shared";

export const searchRouter = Router();

type PageSearchRow = {
  title: string;
  slug: string;
  seoDescription: string | null;
  status: string;
  publishAt: Date | null;
  noIndex: boolean;
};

type ItemSearchRow = {
  title: string;
  slug: string;
  excerpt: string | null;
  seoDescription: string | null;
  noIndex: boolean;
  collectionSlug: string;
};

/** Public site search — Postgres full-text ranking over title + the denormalized
 * searchText column (see extractSearchText), which already carries every string prop
 * across the page's whole component tree, not just title/excerpt/SEO fields. */
searchRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) return res.json({ results: [] });

  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));

  const [pages, items] = await Promise.all([
    prisma.$queryRaw<PageSearchRow[]>(Prisma.sql`
      SELECT title, slug, "seoDescription", status, "publishAt", "noIndex"
      FROM "Page"
      WHERE status = 'PUBLISHED'
        AND to_tsvector('english', title || ' ' || COALESCE("seoDescription", '') || ' ' || "searchText")
            @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank(
        to_tsvector('english', title || ' ' || COALESCE("seoDescription", '') || ' ' || "searchText"),
        plainto_tsquery('english', ${q})
      ) DESC
      LIMIT ${limit}
    `),
    prisma.$queryRaw<ItemSearchRow[]>(Prisma.sql`
      SELECT ci.title, ci.slug, ci.excerpt, ci."seoDescription", ci."noIndex", c.slug AS "collectionSlug"
      FROM "CollectionItem" ci
      JOIN "Collection" c ON c.id = ci."collectionId"
      WHERE ci.status = 'PUBLISHED'
        AND to_tsvector('english', ci.title || ' ' || COALESCE(ci.excerpt, '') || ' ' || COALESCE(ci."seoDescription", '') || ' ' || ci."searchText")
            @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank(
        to_tsvector('english', ci.title || ' ' || COALESCE(ci.excerpt, '') || ' ' || COALESCE(ci."seoDescription", '') || ' ' || ci."searchText"),
        plainto_tsquery('english', ${q})
      ) DESC
      LIMIT ${limit}
    `),
  ]);

  const results = [
    ...pages
      .filter((p) => isPagePubliclyVisible(p) && !p.noIndex)
      .map((p) => ({
        type: "page" as const,
        title: p.title,
        url: `/${p.slug}`,
        excerpt: p.seoDescription ?? null,
      })),
    ...items
      .filter((i) => !i.noIndex)
      .map((i) => ({
        type: "collection" as const,
        title: i.title,
        url: `/${i.collectionSlug}/${i.slug}`,
        excerpt: i.excerpt ?? i.seoDescription ?? null,
      })),
  ].slice(0, limit);

  res.json({ results });
});
