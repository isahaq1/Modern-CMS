import type { CSSProperties } from "react";
import type { SectionProps } from "./types";
import { withContentLinks } from "./ContentLinks";

export function Column({ node, children }: SectionProps) {
  const links = node.props.links as { label?: string; href: string }[];
  // Falls back to the parent Container's cascaded choice (--pgcms-container-* custom
  // properties set in Container.tsx) whenever this column hasn't set its own explicit
  // alignment — same pattern as GridCell falling back to its parent Grid.
  const justifyContent =
    node.style.justifyContent === "between"
      ? "space-between"
      : node.style.justifyContent || "var(--pgcms-container-justify-content, start)";
  const alignItems = node.style.alignItems || "var(--pgcms-container-align-items, stretch)";

  const content = (
    <div
      className="flex flex-col gap-4 min-h-[40px] h-full"
      style={{ justifyContent, alignItems } as CSSProperties}
    >
      {children}
    </div>
  );

  return withContentLinks(links, content, "block h-full");
}
