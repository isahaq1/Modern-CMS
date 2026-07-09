import type { CSSProperties } from "react";
import type { NodeStyle } from "@pgcms/shared";

const BOX_SHADOWS: Record<string, string> = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

export function nodeStyleToCss(style: NodeStyle, isHeader?: boolean): CSSProperties {
  return {
    position: isHeader ? undefined : "relative",
    backgroundColor: style.backgroundColor || undefined,
    backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined,
    backgroundSize: style.backgroundImage ? "cover" : undefined,
    backgroundPosition: style.backgroundImage ? "center" : undefined,
    backgroundRepeat: style.backgroundImage ? "no-repeat" : undefined,
    color: style.textColor || undefined,
    fontFamily: style.fontFamily ? `"${style.fontFamily}", sans-serif` : undefined,
    fontSize: style.fontSize || undefined,
    fontWeight: (style.fontWeight as CSSProperties["fontWeight"]) || undefined,
    paddingTop: style.paddingTop || style.paddingY || undefined,
    paddingBottom: style.paddingBottom || style.paddingY || undefined,
    paddingLeft: style.paddingLeft || style.paddingX || undefined,
    paddingRight: style.paddingRight || style.paddingX || undefined,
    marginTop: style.marginTop || style.marginY || undefined,
    marginBottom: style.marginBottom || style.marginY || undefined,
    textAlign: style.textAlign || undefined,
    width: style.width || undefined,
    height: style.height || undefined,
    minWidth: style.minWidth || undefined,
    minHeight: style.minHeight || undefined,
    maxHeight: style.maxHeight || undefined,
    borderRadius: style.borderRadius || undefined,
    maxWidth: style.maxWidth || undefined,
    // A constrained-width section centers itself; without auto margins it would pin
    // to the left edge, which is never what an editor narrowing a section wants.
    marginLeft: style.maxWidth || style.width ? "auto" : undefined,
    marginRight: style.maxWidth || style.width ? "auto" : undefined,
    overflow: style.maxHeight || style.height || style.backgroundVideo ? "hidden" : undefined,
    borderWidth: style.borderStyle && style.borderStyle !== "none" ? style.borderWidth || "1px" : undefined,
    borderStyle: style.borderStyle && style.borderStyle !== "none" ? style.borderStyle : undefined,
    borderColor: style.borderStyle && style.borderStyle !== "none" ? style.borderColor || "#000000" : undefined,
    boxShadow: style.boxShadow && style.boxShadow !== "none" ? BOX_SHADOWS[style.boxShadow] : undefined,
    opacity: style.opacity !== undefined ? style.opacity : undefined,
    // A Grid Cell spanning multiple tracks of its parent Grid — this has to live on
    // the node's own section (the actual CSS grid item), not inside the component's
    // own JSX, since a nested div has no say over its ancestor's grid placement.
    gridColumn: style.gridColumnSpan && style.gridColumnSpan > 1 ? `span ${style.gridColumnSpan}` : undefined,
    gridRow: style.gridRowSpan && style.gridRowSpan > 1 ? `span ${style.gridRowSpan}` : undefined,
    // Spread last so an explicit custom property always wins over a generated default
    // above — the whole point of the escape hatch is that it can override anything.
    ...(style.customCss as CSSProperties | undefined),
  };
}

/** Arbitrary HTML attributes (data-*, aria-*, id, ...) an editor added via the
 * Inspector's Advanced panel, ready to spread onto the rendered element. "class" is
 * folded into `className` so it composes with the component's own classes instead of
 * colliding with React's reserved prop name. */
export function nodeCustomAttributes(style: NodeStyle): { attrs: Record<string, string>; extraClassName?: string } {
  const custom = style.customAttributes;
  if (!custom) return { attrs: {} };
  const attrs: Record<string, string> = {};
  let extraClassName: string | undefined;
  for (const [key, value] of Object.entries(custom)) {
    if (key === "class" || key === "className") extraClassName = value;
    else if (key === "style") continue;
    else attrs[key] = value;
  }
  return { attrs, extraClassName };
}
