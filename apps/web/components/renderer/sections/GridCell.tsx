import type { CSSProperties } from "react";
import type { SectionProps } from "./types";

/**
 * One slot of a parent Grid. The cell's span across the parent's tracks is applied to
 * its own outer element via NodeStyle (gridColumnSpan/gridRowSpan → nodeStyleToCss),
 * not here, since a grid item's placement is controlled by properties on the item
 * itself, not its children.
 *
 * Content alignment falls back to the parent Grid's own choice (via the
 * --pgcms-grid-align-items/-justify-content custom properties it sets — see Grid.tsx)
 * whenever this cell hasn't set its own explicit alignment, so choosing an alignment
 * once on the Grid applies uniformly to every cell instead of requiring each one
 * configured individually. The var() fallbacks (stretch/start) only matter if a cell
 * somehow renders outside a Grid — normally the parent always provides the vars.
 */
export function GridCell({ node, children }: SectionProps) {
  const justifyContent = node.style.justifyContent
    ? node.style.justifyContent === "between"
      ? "space-between"
      : node.style.justifyContent
    : "var(--pgcms-grid-justify-content, start)";
  const alignItems = node.style.alignItems || "var(--pgcms-grid-align-items, stretch)";

  return (
    <div
      className="flex flex-col gap-4 min-h-[40px] h-full"
      style={{ justifyContent, alignItems } as CSSProperties}
    >
      {children}
    </div>
  );
}
