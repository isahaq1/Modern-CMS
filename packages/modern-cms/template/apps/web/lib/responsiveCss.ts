import type { CSSProperties } from "react";
import type { PageNode } from "@pgcms/shared";
import { BREAKPOINT_MAX_WIDTH } from "@pgcms/shared";
import { nodeStyleToCss } from "./style";

/** camelCase CSS property → kebab-case declaration name. */
function kebab(key: string): string {
  return key.startsWith("--") ? key : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function declarations(css: CSSProperties): string {
  return Object.entries(css)
    .filter(([key, value]) => value !== undefined && value !== null && key !== "position")
    // Base styles are inline (highest non-!important specificity), so every responsive
    // declaration needs !important to actually win at its breakpoint.
    .map(([key, value]) => `${kebab(key)}: ${value} !important;`)
    .join(" ");
}

/** CSS text applying a node's tablet/mobile style overrides via max-width media
 * queries, scoped to the node's data-node-id. Returns null when the node has no
 * responsive overrides at all (the common case — no <style> tag is emitted). */
export function buildNodeResponsiveCss(node: PageNode): string | null {
  const blocks: string[] = [];
  if (node.styleTablet && Object.keys(node.styleTablet).length > 0) {
    const decls = declarations(nodeStyleToCss(node.styleTablet));
    if (decls) {
      blocks.push(
        `@media (max-width: ${BREAKPOINT_MAX_WIDTH.tablet}px) { [data-node-id="${node.id}"] { ${decls} } }`
      );
    }
  }
  if (node.styleMobile && Object.keys(node.styleMobile).length > 0) {
    const decls = declarations(nodeStyleToCss(node.styleMobile));
    if (decls) {
      blocks.push(
        `@media (max-width: ${BREAKPOINT_MAX_WIDTH.mobile}px) { [data-node-id="${node.id}"] { ${decls} } }`
      );
    }
  }
  return blocks.length > 0 ? blocks.join("\n") : null;
}
