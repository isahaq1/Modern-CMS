import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  isRtlLocale,
  type NavItem,
  type Page,
  type PageNode,
  type PageTranslationInfo,
  type SiteTheme,
} from "@pgcms/shared";
import { ApiError } from "@/lib/api";
import { serverGet } from "@/lib/serverApi";
import { ThemeStyleTag } from "@/components/theme/ThemeProvider";
import { PublicPageView } from "@/components/renderer/PublicPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";
import { AnalyticsScripts } from "@/components/theme/AnalyticsScripts";

type GlobalSection = { kind: string; enabled: boolean; content: PageNode };

type CollectionItemDetail = {
  id: string;
  slug: string;
  title: string;
  content: PageNode;
  excerpt?: string | null;
  coverImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
  publishedAt?: string | null;
  collectionSlug: string;
  collectionName: string;
};

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

function pageUrl(slug: string) {
  return `${SITE_URL}/${slug}`;
}

/** A URL that isn't a page may be a collection item: /{collectionSlug}/{itemSlug}. */
async function loadCollectionItemAsPage(
  slug: string,
): Promise<{ page: Page; datePublished: string | null } | null> {
  const parts = slug.split("/");
  if (parts.length < 2) return null;
  const [collectionSlug, ...rest] = parts;
  try {
    const item = await serverGet<CollectionItemDetail>(
      `/api/collections/public/${collectionSlug}/items/${rest.join("/")}`,
      { tags: ["cms", `collection-item:${slug}`] },
    );
    const page = {
      id: item.id,
      slug,
      title: item.title,
      status: "PUBLISHED",
      content: item.content,
      seoTitle: item.seoTitle ?? item.title,
      seoDescription: item.seoDescription ?? item.excerpt ?? null,
      ogImage: item.ogImage ?? item.coverImage ?? null,
      noIndex: item.noIndex ?? false,
      locale: "en",
    } as Page;
    return { page, datePublished: item.publishedAt ?? null };
  } catch {
    return null;
  }
}

/** A collection-item slug is /{collectionSlug}/{itemSlug} — mirrors the split in
 * loadCollectionItemAsPage. Returns [] harmlessly for an ordinary page slug (no second
 * segment) or when nothing matches, so this can run unconditionally alongside the page
 * translations fetch without knowing yet which kind of content this slug resolves to. */
async function loadCollectionItemTranslations(slug: string): Promise<PageTranslationInfo[]> {
  const parts = slug.split("/");
  if (parts.length < 2) return [];
  const [collectionSlug, ...rest] = parts;
  return serverGet<PageTranslationInfo[]>(
    `/api/collections/public/${collectionSlug}/items/${rest.join("/")}/translations`,
    { tags: ["cms", `collection-item:${slug}`] },
  ).catch(() => [] as PageTranslationInfo[]);
}

async function loadData(slug: string) {
  const pageTag = `page:${slug || "home"}`;
  let contentType: "page" | "collectionItem" = "page";
  let datePublished: string | null = null;
  try {
    const [page, theme, navItems, globalSections, pageTranslations, collectionItemTranslations] =
      await Promise.all([
        serverGet<Page>(`/api/pages/public/${slug || "home"}`, {
          tags: ["cms", pageTag],
        }).catch(async (err) => {
          const item = await loadCollectionItemAsPage(slug);
          if (item) {
            contentType = "collectionItem";
            datePublished = item.datePublished;
            return item.page;
          }
          throw err;
        }),
        serverGet<SiteTheme>(`/api/theme/public`, {
          tags: ["cms", "cms-theme"],
        }),
        serverGet<NavItem[]>(`/api/theme/nav/public`, {
          tags: ["cms", "cms-nav"],
        }),
        serverGet<GlobalSection[]>(`/api/global-sections`, {
          tags: ["cms", "cms-global-sections"],
        }).catch(() => [] as GlobalSection[]),
        serverGet<PageTranslationInfo[]>(
          `/api/pages/public-translations?slug=${encodeURIComponent(slug || "home")}`,
          { tags: ["cms", pageTag] },
        ).catch(() => [] as PageTranslationInfo[]),
        loadCollectionItemTranslations(slug),
      ]);
    // A slug is either an ordinary page or a collection item, never both — only one of
    // these two ever comes back non-empty.
    const translations = pageTranslations.length > 0 ? pageTranslations : collectionItemTranslations;
    const globalHeader =
      globalSections.find((s) => s.kind === "header" && s.enabled)?.content ??
      null;
    const globalFooter =
      globalSections.find((s) => s.kind === "footer" && s.enabled)?.content ??
      null;
    const globalGoToTop =
      globalSections.find((s) => s.kind === "goToTop" && s.enabled)?.content ??
      null;
    return {
      page,
      theme,
      navItems,
      globalHeader,
      globalFooter,
      globalGoToTop,
      translations,
      contentType,
      datePublished,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status !== 404) {
      console.error(
        `Failed to load public page data for slug "${slug}":`,
        err.status,
        err.message,
      );
    } else if (!(err instanceof ApiError)) {
      console.error(`Failed to load public page data for slug "${slug}":`, err);
    }
    return null;
  }
}

function buildMetadata(
  data: NonNullable<Awaited<ReturnType<typeof loadData>>>,
  slug: string,
): Metadata {
  const title = data.page.seoTitle || data.page.title;
  const description = data.page.seoDescription ?? undefined;
  const url = pageUrl(slug);
  const ogImage = data.page.ogImage ?? undefined;

  const languages: Record<string, string> = {};
  for (const t of data.translations) {
    languages[t.locale] = pageUrl(t.slug);
  }
  if (data.page.locale) {
    languages[data.page.locale] = url;
  }

  return {
    title,
    description,
    alternates: {
      canonical: url,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: data.page.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug: slugParts } = await params;
  const slug = (slugParts ?? []).join("/");
  const data = await loadData(slug);
  if (!data) return {};
  return buildMetadata(data, slug);
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug: slugParts } = await params;
  const slug = (slugParts ?? []).join("/");
  const data = await loadData(slug);
  if (!data) {
    // Not a page, not a collection item — before 404ing, honor any redirect an editor
    // configured for this old path (kept inbound links alive across restructures).
    const target = await serverGet<{ toPath: string; permanent: boolean }>(
      `/api/redirects/resolve?path=${encodeURIComponent("/" + slug)}`,
    ).catch(() => null);
    if (target) {
      if (target.permanent) permanentRedirect(target.toPath);
      redirect(target.toPath);
    }
    notFound();
  }

  const locale = data.page.locale || "en";
  const url = pageUrl(slug);

  return (
    <div lang={locale} dir={isRtlLocale(locale) ? "rtl" : "ltr"}>
      <JsonLd page={data.page} theme={data.theme} url={url} contentType={data.contentType} datePublished={data.datePublished} />
      <ThemeStyleTag theme={data.theme} />
      <AnalyticsScripts theme={data.theme} />
      <PublicPageView
        page={data.page}
        theme={data.theme}
        navItems={data.navItems}
        globalHeader={data.globalHeader}
        globalFooter={data.globalFooter}
        globalGoToTop={data.globalGoToTop}
        pageLocale={locale}
        translations={data.translations}
      />
      {data.theme.darkModeEnabled && <DarkModeToggle />}
    </div>
  );
}
