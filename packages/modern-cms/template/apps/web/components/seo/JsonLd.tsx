import type { Page, PageNode, SiteTheme } from "@pgcms/shared";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

type FaqItem = { question: string; answer: string };

/** Collects every accordion's question/answer pairs across the whole tree — an
 * accordion is the CMS's FAQ block (see components.ts), so any page using one for
 * real Q&A content earns FAQPage rich-result eligibility for free. */
function collectFaqItems(node: PageNode): FaqItem[] {
  const items: FaqItem[] = [];
  function walk(n: PageNode) {
    if (n.type === "accordion") {
      const raw = (n.props.items as { question?: string; answer?: string }[]) ?? [];
      for (const it of raw) {
        if (it.question && it.answer) items.push({ question: it.question, answer: it.answer });
      }
    }
    n.children.forEach(walk);
  }
  walk(node);
  return items;
}

/** JSON-LD structured data for public pages — helps search engines understand content.
 * Emits one primary entity (WebPage for ordinary pages, Article for collection items
 * like blog posts) plus a BreadcrumbList derived from the URL, plus an FAQPage entity
 * whenever the content actually contains FAQ-shaped content (see collectFaqItems). */
export function JsonLd({
  page,
  theme,
  url,
  contentType = "page",
  datePublished,
}: {
  page: Pick<Page, "title" | "seoTitle" | "seoDescription" | "ogImage" | "content">;
  theme: Pick<SiteTheme, "siteName">;
  url: string;
  /** "collectionItem" (a blog post, a news item...) renders as Article instead of
   * WebPage — Article is what search engines expect for dated, authored content. */
  contentType?: "page" | "collectionItem";
  datePublished?: string | null;
}) {
  const name = page.seoTitle || page.title;
  const description = page.seoDescription ?? undefined;

  const primary =
    contentType === "collectionItem"
      ? {
          "@type": "Article",
          headline: name,
          description,
          url,
          ...(page.ogImage ? { image: page.ogImage } : {}),
          ...(datePublished ? { datePublished } : {}),
          publisher: { "@type": "Organization", name: theme.siteName },
        }
      : {
          "@type": "WebPage",
          name,
          description,
          url,
          isPartOf: { "@type": "WebSite", name: theme.siteName, url: SITE_URL },
          ...(page.ogImage ? { image: page.ogImage } : {}),
        };

  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const breadcrumb =
    segments.length > 0
      ? {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: theme.siteName, item: SITE_URL },
            ...segments.map((seg, i) => ({
              "@type": "ListItem",
              position: i + 2,
              name: decodeURIComponent(seg).replace(/-/g, " "),
              item: `${SITE_URL}/${segments.slice(0, i + 1).join("/")}`,
            })),
          ],
        }
      : null;

  const faqItems = collectFaqItems(page.content);
  const faq =
    faqItems.length > 0
      ? {
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  const schemas = [
    { "@context": "https://schema.org", ...primary },
    ...(breadcrumb ? [{ "@context": "https://schema.org", ...breadcrumb }] : []),
    ...(faq ? [{ "@context": "https://schema.org", ...faq }] : []),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  );
}
