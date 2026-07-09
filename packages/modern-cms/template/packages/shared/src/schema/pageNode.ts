import { z } from "zod";

export const NodeStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  backgroundOverlay: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  paddingY: z.string().optional(),
  paddingX: z.string().optional(),
  // Individual sides win over the Y/X pair when both are set.
  paddingTop: z.string().optional(),
  paddingRight: z.string().optional(),
  paddingBottom: z.string().optional(),
  paddingLeft: z.string().optional(),
  marginY: z.string().optional(),
  marginTop: z.string().optional(),
  marginBottom: z.string().optional(),
  // Flex/grid child alignment — applied by Container (grid) and Column (flex column).
  alignItems: z.enum(["start", "center", "end", "stretch"]).optional(),
  justifyContent: z.enum(["start", "center", "end", "between"]).optional(),
  // A Grid Cell's own placement within its parent Grid — how many of the Grid's
  // declared column/row tracks this cell occupies. 1 (or unset) is a normal single
  // cell; the parent Grid's row/column *counts* live in its own props, not here.
  gridColumnSpan: z.number().optional(),
  gridRowSpan: z.number().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  // Full dimension control — all six accept any CSS length (px, %, rem, vw, vh...).
  // Drag-resize writes width/height when set, else maxWidth/minHeight, preserving
  // whichever unit the value already uses.
  width: z.string().optional(),
  height: z.string().optional(),
  minWidth: z.string().optional(),
  minHeight: z.string().optional(),
  maxHeight: z.string().optional(),
  borderRadius: z.string().optional(),
  maxWidth: z.string().optional(),
  borderWidth: z.string().optional(),
  borderStyle: z.enum(["none", "solid", "dashed", "dotted", "double"]).optional(),
  borderColor: z.string().optional(),
  boxShadow: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  opacity: z.number().optional(),
  // A Container's grid track size for one of its Columns — distinct from `maxWidth`
  // (which constrains content *within* a track) because CSS Grid track width can't be
  // driven by a child's own max-width; the Container reads this per-child to build its
  // own grid-template-columns. Unset means "share remaining space equally" (1fr).
  columnWidth: z.string().optional(),
  // Universal animation, applied to any node type by Renderer.tsx via GSAP. "none"
  // is the off switch — every other field below is ignored when animationType is
  // unset or "none".
  animationType: z
    .enum([
      "none",
      "fadeIn",
      "slideUp",
      "slideDown",
      "slideLeft",
      "slideRight",
      "zoomIn",
      "scrollReveal",
      "rotateIn",
      "pulse",
      "blurIn",
      "flipIn",
      "bounceIn",
    ])
    .optional(),
  // onLoad/onScroll play once automatically (a reveal); onHover/onFocus play forward
  // and reverse back out on mouse-leave/blur (a toggle); onClick replays from the start
  // on every click (a tap acknowledgement).
  animationTrigger: z.enum(["onLoad", "onScroll", "onHover", "onFocus", "onClick"]).optional(),
  animationDuration: z.number().optional(),
  animationDelay: z.number().optional(),
  animationEasing: z.string().optional(),
  // Only meaningful for onLoad/onScroll — repeats the reveal indefinitely, alternating
  // direction each pass, for continuous decorative motion instead of a one-time reveal.
  animationLoop: z.boolean().optional(),
  // Only meaningful for onLoad/onScroll — instead of revealing the whole section as one
  // block, its inner items (cards, paragraphs, buttons) reveal one after another,
  // this many seconds apart.
  animationStagger: z.number().optional(),
  // Continuous scroll-linked drift: the section translates vertically as it moves
  // through the viewport (-1..1, negative = drifts up against the scroll). Independent
  // of the entrance animation.
  parallaxSpeed: z.number().optional(),
  // Always-on pointer effect, independent of animationType/Trigger — a modern card
  // feel: lift (rise + shadow), tilt (3D follow the pointer), glow, or scale.
  hoverEffect: z.enum(["none", "lift", "tilt", "glow", "scale"]).optional(),
  // Glassmorphism: translucent frosted-glass panel (backdrop blur + soft border).
  glass: z.boolean().optional(),
  // Gradient-filled headings (background-clip: text) — set both to activate.
  textGradientFrom: z.string().optional(),
  textGradientTo: z.string().optional(),
  // Escape hatch for anything not covered by a dedicated style field — arbitrary CSS
  // properties (camelCase, merged into the node's inline style) and arbitrary HTML
  // attributes (kebab-case, spread onto the rendered element) that a content editor can
  // add without needing a code change.
  customCss: z.record(z.string(), z.string()).optional(),
  customAttributes: z.record(z.string(), z.string()).optional(),
});
export type NodeStyle = z.infer<typeof NodeStyleSchema>;

// Recursive PageNode type: id + component type + arbitrary content props + style + children.
// styleTablet/styleMobile are sparse per-breakpoint overrides merged over `style`:
// tablet applies ≤1023px, mobile applies ≤767px (on top of tablet).
export type PageNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style: NodeStyle;
  styleTablet?: NodeStyle;
  styleMobile?: NodeStyle;
  children: PageNode[];
};

export const PageNodeSchema: z.ZodType<PageNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    props: z.record(z.string(), z.unknown()),
    style: NodeStyleSchema,
    styleTablet: NodeStyleSchema.optional(),
    styleMobile: NodeStyleSchema.optional(),
    children: z.array(PageNodeSchema),
  })
);

export type Breakpoint = "desktop" | "tablet" | "mobile";

export const BREAKPOINT_MAX_WIDTH: Record<Exclude<Breakpoint, "desktop">, number> = {
  tablet: 1023,
  mobile: 767,
};

/** The style a node effectively has at a breakpoint: base, with the tablet override
 * applied for tablet AND mobile, and the mobile override applied on top for mobile —
 * mirroring how the emitted max-width media queries cascade on the public site. */
export function resolveNodeStyle(node: PageNode, breakpoint: Breakpoint): NodeStyle {
  if (breakpoint === "desktop") return node.style;
  if (breakpoint === "tablet") return { ...node.style, ...node.styleTablet };
  return { ...node.style, ...node.styleTablet, ...node.styleMobile };
}

export const PageStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export type PageStatus = z.infer<typeof PageStatusSchema>;

export const PageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  status: PageStatusSchema,
  content: PageNodeSchema,
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
  previewToken: z.string().optional(),
  publishAt: z.string().nullable().optional(),
  locale: z.string().optional(),
  translationOfId: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Page = z.infer<typeof PageSchema>;

/** Locales offered in the page-settings dropdown. `label` is the language's own name
 * (how switchers conventionally show it); any BCP-47 tag typed into the API works too. */
export const SUPPORTED_LOCALES: { code: string; label: string; rtl?: boolean }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ar", label: "العربية", rtl: true },
  { code: "he", label: "עברית", rtl: true },
  { code: "fa", label: "فارسی", rtl: true },
  { code: "ur", label: "اردو", rtl: true },
];

const RTL_PREFIXES = new Set(["ar", "he", "fa", "ur", "ps", "sd", "ckb", "dv", "yi"]);

/** Whether a locale is written right-to-left — drives dir="rtl" on the page wrapper. */
export function isRtlLocale(locale: string | undefined): boolean {
  if (!locale) return false;
  return RTL_PREFIXES.has(locale.toLowerCase().split(/[-_]/)[0]);
}

/** One entry of a page's translation group, as returned by the public translations
 * endpoint — everything a language switcher needs. */
export type PageTranslationInfo = { locale: string; slug: string; title: string };

export const CreatePageInputSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9/-]*$/, "Slug must be lowercase letters, numbers, hyphens, and slashes only"),
  locale: z.string().min(2).max(20).optional(),
  // When set, the new page's content is seeded from this PageTemplate (deep-cloned
  // with fresh node ids) instead of starting blank.
  templateId: z.string().optional(),
});
export type CreatePageInput = z.infer<typeof CreatePageInputSchema>;

export const UpdatePageInputSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    // Allow "/" so localized slugs can be path-prefixed, e.g. "es/servicios".
    .regex(/^[a-z0-9/-]*$/)
    .optional(),
  content: PageNodeSchema.optional(),
  status: PageStatusSchema.optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
  publishAt: z.string().nullable().optional(),
  locale: z.string().min(2).max(20).optional(),
  translationOfId: z.string().nullable().optional(),
});
export type UpdatePageInput = z.infer<typeof UpdatePageInputSchema>;

export const PageRevisionSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  title: z.string(),
  content: PageNodeSchema,
  createdAt: z.string(),
});
export type PageRevision = z.infer<typeof PageRevisionSchema>;

/** Whether a page is actually visible to the public right now — PUBLISHED alone isn't
 * enough if a future publishAt has been set (scheduled publishing). Accepts Date
 * objects from Prisma as well as ISO strings from the API JSON layer. */
export function isPagePubliclyVisible(page: {
  status: string;
  publishAt?: string | Date | null;
}): boolean {
  if (page.status !== "PUBLISHED") return false;
  if (!page.publishAt) return true;
  const at =
    page.publishAt instanceof Date
      ? page.publishAt.getTime()
      : new Date(page.publishAt).getTime();
  return at <= Date.now();
}
