"use client";

import { createContext, useContext } from "react";
import type { NavItem, PageTranslationInfo, SiteTheme } from "@pgcms/shared";

export type SiteDataValue = {
  theme: SiteTheme;
  navItems: NavItem[];
  /** The current page's locale + its translation group — feeds the Language Switcher
   * component. Absent in contexts without a current page (builder canvas). */
  pageLocale?: string;
  translations?: PageTranslationInfo[];
};

const defaultTheme: SiteTheme = {
  primaryColor: "#2563eb",
  secondaryColor: "#0f172a",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  headingFont: "Poppins",
  bodyFont: "Inter",
  siteName: "My Site",
  logoUrl: null,
  faviconUrl: null,
  customCss: null,
  darkModeEnabled: false,
  primaryColorDark: null,
  backgroundColorDark: null,
  textColorDark: null,
  analyticsProvider: "none",
  analyticsId: null,
  analyticsCustomScript: null,
};

export const SiteDataContext = createContext<SiteDataValue>({ theme: defaultTheme, navItems: [] });

export function useSiteData() {
  return useContext(SiteDataContext);
}
