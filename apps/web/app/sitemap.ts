import type { MetadataRoute } from "next";
import { serverGet } from "@/lib/serverApi";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

type PublicPage = { slug: string; updatedAt?: string };
type SitemapItem = { path: string; updatedAt: string };

/** /sitemap.xml — every publicly-visible page and collection item, straight from the
 * API at request time so it's always current without a rebuild. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, items] = await Promise.all([
    serverGet<PublicPage[]>("/api/pages/public").catch(() => [] as PublicPage[]),
    serverGet<SitemapItem[]>("/api/collections/public-sitemap").catch(() => [] as SitemapItem[]),
  ]);

  return [
    ...pages.map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    })),
    ...items.map((i) => ({
      url: `${SITE_URL}/${i.path}`,
      lastModified: new Date(i.updatedAt),
    })),
  ];
}
