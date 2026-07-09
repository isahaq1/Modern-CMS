import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isRtlLocale, type NavItem, type Page, type PageNode, type SiteTheme } from "@pgcms/shared";
import { serverGet } from "@/lib/serverApi";
import { ThemeStyleTag } from "@/components/theme/ThemeProvider";
import { PublicPageView } from "@/components/renderer/PublicPageView";
import { JsonLd } from "@/components/seo/JsonLd";

type GlobalSection = { kind: string; enabled: boolean; content: PageNode };

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

async function loadPreview(token: string) {
  try {
    const [page, theme, navItems, globalSections] = await Promise.all([
      serverGet<Page>(`/api/pages/preview/${token}`, { tags: [`preview:${token}`], revalidate: 0 }),
      serverGet<SiteTheme>(`/api/theme/public`, { tags: ["cms", "cms-theme"] }),
      serverGet<NavItem[]>(`/api/theme/nav/public`, { tags: ["cms", "cms-nav"] }),
      serverGet<GlobalSection[]>(`/api/global-sections`).catch(() => [] as GlobalSection[]),
    ]);
    const globalHeader = globalSections.find((s) => s.kind === "header" && s.enabled)?.content ?? null;
    const globalFooter = globalSections.find((s) => s.kind === "footer" && s.enabled)?.content ?? null;
    return { page, theme, navItems, globalHeader, globalFooter };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await loadPreview(token);
  if (!data) return { title: "Preview not found" };
  return {
    title: `[Preview] ${data.page.seoTitle || data.page.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadPreview(token);
  if (!data) notFound();

  const locale = data.page.locale || "en";
  const slug = data.page.slug || "";
  const pageUrl = `${SITE_URL}/${slug}`;

  return (
    <div lang={locale} dir={isRtlLocale(locale) ? "rtl" : "ltr"}>
      <div className="bg-amber-500 text-amber-950 text-center text-xs py-1.5 font-medium">
        Draft preview — this page is not published
      </div>
      <JsonLd page={data.page} theme={data.theme} url={pageUrl} />
      <ThemeStyleTag theme={data.theme} />
      <PublicPageView
        page={data.page}
        theme={data.theme}
        navItems={data.navItems}
        globalHeader={data.globalHeader}
        globalFooter={data.globalFooter}
        pageLocale={locale}
        translations={[]}
      />
    </div>
  );
}
