"use client";

import { treeContainsType, type NavItem, type Page, type PageNode, type PageTranslationInfo, type SiteTheme } from "@pgcms/shared";
import { SiteDataContext } from "@/components/theme/SiteDataContext";
import { RendererContext } from "./RendererContext";
import { Renderer } from "./Renderer";

/** When a global section actually carries the site's real chrome (a Header component
 * in the global header, a Footer in the global footer), pages that still contain
 * their own copy would show it twice — logo and nav doubled. The global one wins;
 * page-level copies of that type are skipped. A global tree that's only decoration
 * (utility bar, announcement strip) suppresses nothing. */
function suppressDuplicateChrome(content: PageNode, globalHeader: PageNode | null, globalFooter: PageNode | null): PageNode {
  const dropHeader = !!globalHeader && treeContainsType(globalHeader, "header");
  const dropFooter = !!globalFooter && treeContainsType(globalFooter, "footer");
  if (!dropHeader && !dropFooter) return content;
  return {
    ...content,
    children: content.children.filter(
      (child) => !(dropHeader && child.type === "header") && !(dropFooter && child.type === "footer")
    ),
  };
}

export function PublicPageView({
  page,
  theme,
  navItems,
  globalHeader = null,
  globalFooter = null,
  globalGoToTop = null,
  pageLocale,
  translations,
}: {
  page: Page;
  theme: SiteTheme;
  navItems: NavItem[];
  /** Site-wide chrome (root trees) rendered above/below every page's own content —
   * edited once in Settings → Global Sections instead of per page. */
  globalHeader?: PageNode | null;
  globalFooter?: PageNode | null;
  globalGoToTop?: PageNode | null;
  pageLocale?: string;
  translations?: PageTranslationInfo[];
}) {
  return (
    <SiteDataContext.Provider value={{ theme, navItems, pageLocale, translations }}>
      <RendererContext.Provider value={{ mode: "view", selectedId: null }}>
        {globalHeader && <Renderer node={globalHeader} />}
        <Renderer node={suppressDuplicateChrome(page.content, globalHeader, globalFooter)} />
        {globalFooter && <Renderer node={globalFooter} />}
        {globalGoToTop && <Renderer node={globalGoToTop} />}
      </RendererContext.Provider>
    </SiteDataContext.Provider>
  );
}
