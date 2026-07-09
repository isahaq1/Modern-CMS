import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

/** /robots.txt — allow everything except the admin, and point crawlers at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/preview"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
