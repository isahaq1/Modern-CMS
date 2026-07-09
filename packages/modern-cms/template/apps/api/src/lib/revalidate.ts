/** Ask the Next.js app to bust its ISR cache after content changes. No-op when
 * REVALIDATE_URL / REVALIDATE_SECRET are unset (typical in local dev). */
export async function triggerRevalidation(tags: string[]): Promise<void> {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret || tags.length === 0) return;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tags }),
    });
    if (!res.ok) {
      console.warn(`Revalidation failed (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.warn("Revalidation request failed:", err);
  }
}

export function pageCacheTags(slug: string): string[] {
  const normalized = slug || "home";
  return ["cms", "cms-pages", `page:${normalized}`, "cms-sitemap"];
}
