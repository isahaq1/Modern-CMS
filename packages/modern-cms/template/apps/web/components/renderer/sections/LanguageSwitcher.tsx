"use client";

import Link from "next/link";
import { Languages } from "lucide-react";
import { SUPPORTED_LOCALES } from "@pgcms/shared";
import { useSiteData } from "@/components/theme/SiteDataContext";
import type { SectionProps } from "./types";

/** Lists the current page's translation group as links — the group is resolved
 * server-side per page and provided through SiteDataContext, so this component has
 * no props to configure beyond appearance. */
export function LanguageSwitcher({ node }: SectionProps) {
  const { pageLocale, translations } = useSiteData();
  const compact = node.props.compact === true;
  const items = translations ?? [];

  if (items.length === 0) {
    return (
      <div className="text-xs opacity-60 flex items-center gap-1.5 justify-center">
        <Languages size={14} /> No translations linked to this page yet
      </div>
    );
  }

  function labelFor(locale: string) {
    return SUPPORTED_LOCALES.find((l) => l.code === locale)?.label ?? locale;
  }

  return (
    <nav className="flex items-center gap-2 justify-center flex-wrap" aria-label="Page language">
      <Languages size={16} className="opacity-60" />
      {items.map((t) => {
        const active = t.locale === pageLocale;
        return (
          <Link
            key={t.locale}
            href={`/${t.slug}`}
            hrefLang={t.locale}
            className={
              active
                ? "text-sm font-semibold underline underline-offset-4"
                : "text-sm opacity-70 hover:opacity-100"
            }
          >
            {compact ? t.locale.toUpperCase() : labelFor(t.locale)}
          </Link>
        );
      })}
    </nav>
  );
}
