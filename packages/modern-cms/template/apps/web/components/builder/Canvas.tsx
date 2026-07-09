"use client";

import { useState } from "react";
import type { NavItem, NodeStyle, PageNode, SiteTheme } from "@pgcms/shared";
import { SiteDataContext } from "@/components/theme/SiteDataContext";
import { themeToCssVars } from "@/components/theme/ThemeProvider";
import { DroppableChildren } from "./DroppableChildren";
import { BuilderCanvasNode } from "./BuilderCanvasNode";
import { CanvasOverlayContext } from "./CanvasOverlayContext";

export function Canvas({
  tree,
  theme,
  navItems,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleHidden,
  onChangeStyle,
  onResizeGridTrack,
}: {
  tree: PageNode;
  theme: SiteTheme;
  navItems: NavItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onChangeStyle: (id: string, style: NodeStyle) => void;
  onResizeGridTrack?: (gridId: string, axis: "column" | "row", index: number, size: string) => void;
}) {
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);

  return (
    <div
      className="flex-1 overflow-y-auto bg-slate-100"
      onClick={() => onSelect("")}
      // Real content (Logo, Nav Links, Buttons, CTA, and now linkable Containers/Columns)
      // renders real <a>/<Link> elements straight from the same components used on the
      // live site. A capture-phase preventDefault runs before Next.js's Link ever gets
      // to its own bubble-phase click handler (which checks defaultPrevented and bails
      // out), so clicking one here selects it for editing instead of navigating away.
      onClickCapture={(e) => e.preventDefault()}
    >
      <div
        className="relative isolate mx-auto bg-white min-h-full shadow-sm"
        style={{ ...themeToCssVars(theme), fontFamily: "var(--theme-body-font)" }}
      >
        <SiteDataContext.Provider value={{ theme, navItems }}>
          <CanvasOverlayContext.Provider value={overlayEl}>
            <DroppableChildren parentId={tree.id} childIds={tree.children.map((c) => c.id)}>
              {tree.children.map((child) => (
                <BuilderCanvasNode
                  key={child.id}
                  node={child}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onToggleHidden={onToggleHidden}
                  onChangeStyle={onChangeStyle}
                  onResizeGridTrack={onResizeGridTrack}
                />
              ))}
            </DroppableChildren>
          </CanvasOverlayContext.Provider>
        </SiteDataContext.Provider>
        {/* Toolbar chips portal in here — a flat layer scrolling with the content,
            immune to any ancestor's compositing/stacking-context quirks. */}
        <div ref={setOverlayEl} className="absolute inset-0 z-40 pointer-events-none" />
      </div>
    </div>
  );
}
