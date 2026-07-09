import type { CSSProperties } from "react";
import type { SectionProps } from "./types";

/**
 * A true 2D CSS Grid — Container/Column only ever lay out a single row of columns.
 * Row/column counts live in props (rows/columns, adjusted via the Inspector's
 * stepper pair, which seeds/grows the matching "gridCell" children). A cell's own
 * span across multiple tracks is a NodeStyle field on the cell itself
 * (gridColumnSpan/gridRowSpan — see lib/style.ts) since it has to land on that cell's
 * own rendered element to actually affect its placement as a grid item.
 */
export function Grid({ node, children }: SectionProps) {
  const rows = Math.max(1, Number(node.props.rows) || 1);
  const columns = Math.max(1, Number(node.props.columns) || 2);
  const gap = (node.props.gap as string) || "24px";
  const alignItems = node.style.alignItems || undefined;
  const justifyContent = node.style.justifyContent === "between" ? "space-between" : node.style.justifyContent || undefined;

  // Per-track sizes (see setGridTrackSize) — dragging a cell's resize handle sets the
  // specific column/row track it belongs to, same as resizing a column in a
  // spreadsheet. Missing/short arrays fall back to the original even-split behavior.
  const columnTracks = Array.isArray(node.props.columnTracks) ? (node.props.columnTracks as string[]) : [];
  const rowTracks = Array.isArray(node.props.rowTracks) ? (node.props.rowTracks as string[]) : [];
  const gridTemplateColumns = Array.from({ length: columns }, (_, i) => columnTracks[i] || "minmax(0, 1fr)").join(" ");
  const gridTemplateRows = Array.from({ length: rows }, (_, i) => rowTracks[i] || "minmax(80px, auto)").join(" ");

  return (
    <div
      className="grid"
      style={
        {
          gridTemplateColumns,
          gridTemplateRows,
          gap,
          // Governs how each cell's own section sizes/sits within its row (a section
          // shorter than the row when alignItems isn't "stretch").
          alignItems,
          justifyContent,
          // The same choice ALSO cascades into every cell's own inner content
          // alignment (see GridCell.tsx) via inherited CSS custom properties — custom
          // properties pass straight through a grid item's box to its descendants, so
          // this reaches each cell without the Grid needing to know its children. A
          // cell can still override just itself from its own Style tab. Defaults
          // match the pre-existing unset look (full-width content, top-anchored)
          // rather than the CSS spec defaults for these vars' *own* initial values.
          "--pgcms-grid-align-items": alignItems ?? "stretch",
          "--pgcms-grid-justify-content": justifyContent ?? "start",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
