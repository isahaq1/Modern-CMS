import type { CSSProperties } from "react";
import type { SectionProps } from "./types";
import { withContentLinks } from "./ContentLinks";

export function Container({ node, children }: SectionProps) {
  const gap = (node.props.gap as string) || "24px";
  const links = node.props.links as { label?: string; href: string }[];

  // Each column drives its own grid track width via style.columnWidth (set by dragging
  // its resize handle) — unset means "share remaining space equally" (1fr), same as a
  // plain repeat(N, 1fr) grid would give every column before any of them are resized.
  const gridTemplateColumns = node.children.map((c) => c.style.columnWidth || "minmax(0, 1fr)").join(" ");

  const alignItems = node.style.alignItems || undefined;
  const justifyContent = node.style.justifyContent === "between" ? "space-between" : node.style.justifyContent || undefined;

  const grid = (
    <div
      className="grid"
      style={
        {
          gridTemplateColumns,
          gap,
          // Governs how each column's own track sizes/sits within the row (only visible
          // when a column is shorter than the row, i.e. alignItems isn't "stretch").
          alignItems,
          justifyContent,
          // The same choice ALSO cascades into every column's own inner content
          // alignment (see Column.tsx) via inherited CSS custom properties, exactly
          // like Grid → GridCell — so choosing an alignment once on the Container
          // applies uniformly instead of requiring each column configured individually.
          // A column can still override just itself from its own Style tab. Defaults
          // match the pre-existing unset look (full-width content, top-anchored).
          "--pgcms-container-align-items": alignItems ?? "stretch",
          "--pgcms-container-justify-content": justifyContent ?? "start",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );

  return withContentLinks(links, grid, "block");
}
