"use client";

import { useRef } from "react";
import type { PageNode } from "@pgcms/shared";
import { nodeStyleToCss, nodeCustomAttributes } from "@/lib/style";
import { buildNodeResponsiveCss } from "@/lib/responsiveCss";
import {
  useEntranceAnimation,
  useModernEffects,
} from "@/lib/useEntranceAnimation";
import {
  NodeBackgroundLayers,
  hasBackgroundLayers,
} from "./NodeBackgroundLayers";
import { SECTION_COMPONENTS } from "./registry";
import { useRendererContext } from "./RendererContext";
import clsx from "clsx";

export function Renderer({ node }: { node: PageNode }) {
  const { mode, selectedId, onSelect } = useRendererContext();
  const ref = useRef<HTMLElement | null>(null);
  // In edit mode the canvas shows the settled final state — no entrance/pointer motion
  // fighting selection and resize.
  useEntranceAnimation(ref, mode === "edit" ? {} : node.style);
  useModernEffects(ref, mode === "edit" ? {} : node.style);

  // Non-destructive show/hide: hidden nodes keep their configured content but never
  // render on the live site. They still render in the builder (see BuilderCanvasNode)
  // so the user can find and re-enable them.
  if (node.props.hidden === true) return null;

  if (node.type === "root") {
    return (
      // display: contents — the wrapper must not create a box, or it becomes a sticky
      // header's containing block (exactly the header's own height, so it could never
      // stick). With no box, sections sit directly in the page-height wrapper and
      // position: sticky gets the whole page to travel.
      <div style={{ display: "contents" }}>
        {node.children.map((child) => (
          <Renderer key={child.id} node={child} />
        ))}
      </div>
    );
  }

  const Component = SECTION_COMPONENTS[node.type];
  if (!Component) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200">
        Unknown component type: {node.type}
      </div>
    );
  }

  const children = node.children.map((child) => (
    <Renderer key={child.id} node={child} />
  ));
  const { attrs: customAttrs, extraClassName } = nodeCustomAttributes(
    node.style,
  );
  const responsiveCss = buildNodeResponsiveCss(node);

  const hasTextGradient =
    node.style.textGradientFrom && node.style.textGradientTo;
  const css = nodeStyleToCss(
    node.style,
    node.type === "header" || node.type === "goToTop",
  ) as React.CSSProperties & Record<string, string | number | undefined>;
  if (hasTextGradient) {
    css["--pgcms-tg-from"] = node.style.textGradientFrom;
    css["--pgcms-tg-to"] = node.style.textGradientTo;
  }
  // Sticky lives on the section element itself, not inside the Header component — an
  // inner sticky div's containing block would be this very section (exactly its own
  // height), leaving it zero room to stick. Only on the live site: a header pinned to
  // the canvas viewport while editing would sit on top of unrelated sections.
  if (node.type === "header" && node.props.sticky !== false && mode !== "edit") {
    css.position = "sticky";
    css.top = 0;
    css.zIndex = 50;
  }

  // Don't wrap goToTop in a section in view mode
  if (node.type === "goToTop" && mode !== "edit") {
    return <Component node={node}>{children}</Component>;
  }

  const content = (
    <section
      ref={ref}
      {...customAttrs}
      style={css}
      className={clsx(
        mode === "edit" && "pgcms-editable-hover",
        node.style.glass && "pgcms-glass",
        hasTextGradient && "pgcms-text-gradient",
        // Tilt is JS-driven (useModernEffects); disable all pointer effects in the
        // builder so selecting/resizing doesn't fight a moving target.
        mode !== "edit" &&
          node.style.hoverEffect === "lift" &&
          "pgcms-hover-lift",
        mode !== "edit" &&
          node.style.hoverEffect === "scale" &&
          "pgcms-hover-scale",
        mode !== "edit" &&
          node.style.hoverEffect === "glow" &&
          "pgcms-hover-glow",
        extraClassName,
      )}
      onClick={
        mode === "edit"
          ? (e) => {
              e.stopPropagation();
              onSelect?.(node.id);
            }
          : undefined
      }
      data-node-id={node.id}
    >
      {responsiveCss && (
        <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      )}
      <NodeBackgroundLayers style={node.style} />
      {/* Absolute background layers paint above in-flow content unless the content is
          itself positioned — only add the wrapper when layers exist, so pages without
          video/overlay keep their exact current DOM. */}
      {hasBackgroundLayers(node.style) ? (
        <div
          className={
            node.type === "header" || node.type === "goToTop" ? "" : "relative"
          }
        >
          <Component node={node}>{children}</Component>
        </div>
      ) : (
        <Component node={node}>{children}</Component>
      )}
    </section>
  );

  if (mode === "edit" && selectedId === node.id) {
    return <div className="pgcms-editable-selected">{content}</div>;
  }

  return content;
}
