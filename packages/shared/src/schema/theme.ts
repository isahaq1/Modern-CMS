import { z } from "zod";

export const SiteThemeSchema = z.object({
  id: z.string().optional(),
  primaryColor: z.string().default("#2563eb"),
  secondaryColor: z.string().default("#0f172a"),
  backgroundColor: z.string().default("#ffffff"),
  textColor: z.string().default("#111827"),
  headingFont: z.string().default("Poppins"),
  bodyFont: z.string().default("Inter"),
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  siteName: z.string().default("My Site"),
  customCss: z.string().nullable().optional(),
  darkModeEnabled: z.boolean().default(false),
  primaryColorDark: z.string().nullable().optional(),
  backgroundColorDark: z.string().nullable().optional(),
  textColorDark: z.string().nullable().optional(),
  analyticsProvider: z.enum(["none", "ga4", "plausible", "custom"]).default("none"),
  analyticsId: z.string().nullable().optional(),
  analyticsCustomScript: z.string().nullable().optional(),
});
export type SiteTheme = z.infer<typeof SiteThemeSchema>;

export const UpdateThemeInputSchema = SiteThemeSchema.partial();
export type UpdateThemeInput = z.infer<typeof UpdateThemeInputSchema>;

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "Lato",
  "Nunito",
  "Oswald",
  "Raleway",
] as const;

export const NavItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  order: z.number(),
  parentId: z.string().nullable().optional(),
});
export type NavItem = z.infer<typeof NavItemSchema>;

export const UpsertNavItemInputSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  order: z.number().default(0),
  parentId: z.string().nullable().optional(),
});
export type UpsertNavItemInput = z.infer<typeof UpsertNavItemInputSchema>;

export type NavItemWithChildren = NavItem & { children: NavItem[] };

/** Groups flat nav items into top-level entries with their submenu items attached,
 * each sorted by `order`. Only one level deep — a submenu item's own children (if any
 * exist from bad data) are ignored, matching typical site nav patterns. */
export function buildNavTree(items: NavItem[]): NavItemWithChildren[] {
  const topLevel = items.filter((n) => !n.parentId).sort((a, b) => a.order - b.order);
  return topLevel.map((item) => ({
    ...item,
    children: items.filter((n) => n.parentId === item.id).sort((a, b) => a.order - b.order),
  }));
}
