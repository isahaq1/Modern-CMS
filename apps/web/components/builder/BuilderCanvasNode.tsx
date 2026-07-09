"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import {
  GripVertical,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  CornerLeftUp,
  Bookmark,
} from "lucide-react";
import {
  getComponentDefinition,
  resolveNodeStyle,
  type NodeStyle,
  type PageNode,
} from "@pgcms/shared";
import { SECTION_COMPONENTS } from "@/components/renderer/registry";
import {
  NodeBackgroundLayers,
  hasBackgroundLayers,
} from "@/components/renderer/NodeBackgroundLayers";
import { nodeStyleToCss, nodeCustomAttributes } from "@/lib/style";
import { api } from "@/lib/api";
import { DroppableChildren } from "./DroppableChildren";
import { useCanvasOverlay } from "./CanvasOverlayContext";
import { useBuilderDevice } from "./BuilderDeviceContext";
import { BLOCKS_CHANGED_EVENT } from "./Palette";

type ResizeAxis = "width" | "height" | "both";

export function BuilderCanvasNode({
  node,
  parentId,
  depth = 0,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleHidden,
  onChangeStyle,
  onResizeGridTrack,
  cellIndex,
  gridColumns,
}: {
  node: PageNode;
  /** The id of this node's own parent — lets the toolbar offer "select parent" once a
   * Container/Column is filled edge-to-edge with content and has no background left to
   * click on directly. Undefined for top-level nodes (their parent is the page root,
   * which isn't a real editable node). */
  parentId?: string;
  /** Nesting depth, used to stagger toolbar chip position — a Container whose sole
   * Column holds a sole Hero has all three boxes sharing the exact same top-left
   * corner, so their chips would otherwise render at the identical screen position
   * and only the topmost one could ever be clicked. */
  depth?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onChangeStyle: (id: string, style: NodeStyle) => void;
  /** Resizes one column/row track on the parent Grid (only meaningful when this node
   * is a "gridCell" — a grid track is shared by every cell in that column/row, so the
   * size has to live on the Grid itself, not this cell's own style). */
  onResizeGridTrack?: (gridId: string, axis: "column" | "row", index: number, size: string) => void;
  /** This node's position among its parent Grid's children — only set when the parent
   * is a "grid", used with gridColumns to derive which column/row track a drag-resize
   * on this cell should adjust. */
  cellIndex?: number;
  gridColumns?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });
  const Component = SECTION_COMPONENTS[node.type];
  const def = getComponentDefinition(node.type);
  const selected = selectedId === node.id;
  const hidden = node.props.hidden === true;
  const device = useBuilderDevice();
  // Preview and resize against the device-effective style — the style-write handler
  // in the builder page diffs against the same view, so edits land in the right layer.
  // Memoized for referential stability: it feeds the box-measure effect's deps, and a
  // fresh object every render would make that effect setState itself into a loop.
  const effectiveStyle = useMemo(
    () => resolveNodeStyle(node, device),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.style, node.styleTablet, node.styleMobile, device],
  );
  // Per-instance hover state, not Tailwind's `group-hover` — a shared group name at
  // every nesting depth (Header > Zone > Logo) makes hovering one leaf mark its whole
  // ancestor chain as ":hover", which lights up every *sibling's* toolbar too (e.g.
  // hovering the Logo also revealed Nav Links' and Buttons' toolbars). Local state is
  // scoped to exactly the boxes the pointer is actually inside.
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el);
      boxRef.current = el;
    },
    [setNodeRef],
  );
  const sectionRef = useRef<HTMLElement | null>(null);
  const overlayEl = useCanvasOverlay();
  const [box, setBox] = useState<{
    top: number;
    left: number;
    right: number;
    width: number;
    height: number;
  } | null>(null);

  // Measure the node's own <section>, not the sortable wrapper: a width-constrained
  // section centers inside a still-full-width wrapper, and handles anchored to the
  // wrapper would float in empty space beside the visible box.
  const ownSection = useCallback((): HTMLElement | null => {
    return sectionRef.current ?? boxRef.current;
  }, [sectionRef]);

  // The toolbar/handle chips are portaled into a flat overlay layer instead of nesting
  // `position: absolute` inside this deeply-nested tree (see CanvasOverlayContext for
  // why) — so their screen position has to be measured explicitly rather than
  // expressed with CSS relative to a nearby ancestor.
  useEffect(() => {
    if (!overlayEl || !boxRef.current) {
      setBox(null);
      return;
    }
    const update = () => {
      const target = ownSection();
      if (!target) return;
      const boxRect = target.getBoundingClientRect();
      const overlayRect = overlayEl.getBoundingClientRect();
      setBox({
        top: boxRect.top - overlayRect.top,
        left: boxRect.left - overlayRect.left,
        right: overlayRect.right - boxRect.right,
        width: boxRect.width,
        height: boxRect.height,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [
    overlayEl,
    isHovered,
    isResizing,
    effectiveStyle,
    node.props,
    ownSection,
  ]);

  const startResize = useCallback(
    (axis: ResizeAxis) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = ownSection();
      if (!target) return;
      const startRect = target.getBoundingClientRect();
      const parentWidth = boxRef.current?.getBoundingClientRect().width ?? null;
      const startX = e.clientX;
      const startY = e.clientY;
      setIsResizing(true);

      // Preserve the unit an editor already typed (%, vw, rem...) instead of
      // clobbering it with px — dragging then adjusts the value in that unit.
      function toUnit(
        px: number,
        existing: string | undefined,
        relativeTo: number | null,
      ): string {
        const match = existing?.match(/^[\d.]+(%|vw|vh|rem|em)$/);
        if (match) {
          const unit = match[1];
          if (unit === "%" && relativeTo)
            return `${Math.round((px / relativeTo) * 1000) / 10}%`;
          if (unit === "vw")
            return `${Math.round((px / window.innerWidth) * 1000) / 10}vw`;
          if (unit === "vh")
            return `${Math.round((px / window.innerHeight) * 1000) / 10}vh`;
          if (unit === "rem" || unit === "em")
            return `${Math.round((px / 16) * 100) / 100}${unit}`;
        }
        return `${Math.round(px)}px`;
      }

      function onMove(moveEvent: PointerEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        // A Grid Cell's width/height is entirely governed by its parent Grid's column/
        // row track sizes (every cell in that column/row shares one track) — writing
        // width/maxWidth on the cell itself, like other nodes do, would have zero
        // visual effect since a CSS grid item ignores its own explicit size in favor of
        // the track. Resize the specific track on the Grid instead.
        if (
          node.type === "gridCell" &&
          parentId &&
          onResizeGridTrack &&
          gridColumns &&
          cellIndex !== undefined
        ) {
          const colIndex = cellIndex % gridColumns;
          const rowIndex = Math.floor(cellIndex / gridColumns);
          if (axis === "width" || axis === "both") {
            const widthPx = Math.max(80, startRect.width + dx);
            onResizeGridTrack(parentId, "column", colIndex, `${Math.round(widthPx)}px`);
          }
          if (axis === "height" || axis === "both") {
            const heightPx = Math.max(40, startRect.height + dy);
            onResizeGridTrack(parentId, "row", rowIndex, `${Math.round(heightPx)}px`);
          }
          return;
        }

        const next: NodeStyle = { ...effectiveStyle };
        if (axis === "width" || axis === "both") {
          const widthPx = Math.max(80, startRect.width + dx);
          // A Column's width is a CSS Grid track size owned by its parent Container
          // (see Container.tsx) — max-width has no effect on a grid track, only on
          // content within it — so drag it via a distinct property. For other nodes,
          // adjust an explicit `width` if one is set, else the usual maxWidth.
          if (node.type === "column")
            next.columnWidth = toUnit(
              widthPx,
              effectiveStyle.columnWidth,
              parentWidth,
            );
          else if (effectiveStyle.width)
            next.width = toUnit(widthPx, effectiveStyle.width, parentWidth);
          else
            next.maxWidth = toUnit(
              widthPx,
              effectiveStyle.maxWidth,
              parentWidth,
            );
        }
        if (axis === "height" || axis === "both") {
          const heightPx = Math.max(40, startRect.height + dy);
          if (effectiveStyle.height)
            next.height = toUnit(heightPx, effectiveStyle.height, null);
          else
            next.minHeight = toUnit(heightPx, effectiveStyle.minHeight, null);
        }
        onChangeStyle(node.id, next);
      }
      function onUp() {
        setIsResizing(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        // The pointer has usually moved by the time it's released, so the browser's
        // synthetic "click" lands wherever the cursor ended up — not on this handle —
        // meaning stopPropagation() on the handle's own onClick never runs for it.
        // Swallow that one click at the capture phase so it can't reach the canvas
        // background's deselect-on-click handler.
        window.addEventListener("click", suppressClick, {
          capture: true,
          once: true,
        });
      }
      function suppressClick(clickEvent: MouseEvent) {
        clickEvent.stopPropagation();
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [
      node.id,
      effectiveStyle,
      node.type,
      onChangeStyle,
      ownSection,
      parentId,
      onResizeGridTrack,
      gridColumns,
      cellIndex,
    ],
  );

  const { attrs: customAttrs, extraClassName } =
    nodeCustomAttributes(effectiveStyle);

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0.4 } : {}),
  };

  // A Grid Cell's own box needs to actually fill its (possibly custom-sized, see
  // setGridTrackSize) row track, or a taller row just leaves dead space below the
  // cell's natural content height instead of visibly growing — the cell IS the grid
  // item here, two DOM layers up through plain (non-stretching) wrapper divs. Scoped to
  // gridCell specifically: forcing height:100% on every node type would also stretch
  // ordinary content (a Hero dropped into an already-tall Column, say) to fill space it
  // was never meant to claim.
  const isGridCell = node.type === "gridCell";

  return (
    <div ref={setRefs} style={wrapperStyle} className={clsx("relative", isGridCell && "h-full")}>
      <div
        className={clsx(
          "relative",
          isGridCell && "h-full",
          selected
            ? "ring-2 ring-blue-500 z-10"
            : isHovered
              ? "ring-1 ring-slate-300"
              : "ring-1 ring-transparent",
          hidden && "opacity-40",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
      >
        <section
          {...customAttrs}
          ref={sectionRef}
          style={isGridCell ? { ...nodeStyleToCss(effectiveStyle), height: effectiveStyle.height || "100%" } : nodeStyleToCss(effectiveStyle)}
          className={extraClassName}
        >
          <NodeBackgroundLayers style={effectiveStyle} />
          {Component ? (
            // Absolute background layers paint above unpositioned in-flow content, so
            // when they exist the content needs its own positioned wrapper to win.
            <div
              className={clsx(
                hasBackgroundLayers(effectiveStyle) && "relative",
                isGridCell && "h-full",
              )}
            >
              <Component node={node}>
                {def?.allowsChildren ? (
                  <DroppableChildren
                    parentId={node.id}
                    childIds={node.children.map((c) => c.id)}
                    transparent
                  >
                    {node.children.map((child, childIndex) => (
                      <BuilderCanvasNode
                        key={child.id}
                        node={child}
                        parentId={node.id}
                        depth={depth + 1}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onToggleHidden={onToggleHidden}
                        onChangeStyle={onChangeStyle}
                        onResizeGridTrack={onResizeGridTrack}
                        cellIndex={node.type === "grid" ? childIndex : undefined}
                        gridColumns={node.type === "grid" ? Math.max(1, Number(node.props.columns) || 2) : undefined}
                      />
                    ))}
                  </DroppableChildren>
                ) : undefined}
              </Component>
            </div>
          ) : (
            <div className="p-4 text-sm text-red-600 bg-red-50">
              Unknown component type: {node.type}
            </div>
          )}
        </section>
      </div>

      {overlayEl &&
        box &&
        createPortal(
          <>
            {/* Locked structural slots (e.g. a header's zones) get no toolbar of their
                own — "hide" is a property of the content you put in a zone, not the
                zone slot, and a zone's tight-fitting box would otherwise sit right on
                top of its single child's toolbar, each stealing the other's clicks. */}
            {!def?.locked && isHovered && (
              <div
                className="absolute z-30 flex items-center gap-1.5 bg-slate-900 text-white text-xs rounded px-2 py-1 select-none pointer-events-auto"
                // Nested ancestors sharing the same top-left corner (e.g. a Container
                // whose only Column holds only a Hero) get staggered chips instead of
                // perfectly overlapping ones that only the topmost could ever click.
                style={{ top: box.top - 12, left: box.left + 8 + depth * 88 }}
                // The chip is portaled outside the hoverable content's own DOM subtree,
                // so moving the mouse onto it would otherwise register as leaving the
                // content (mouseleave fires first) and unmount the chip before a click
                // can land. Keep it open while the pointer is over the chip itself too.
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <button
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical size={12} />
                </button>
                <span>{def?.label ?? node.type}</span>
                {parentId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(parentId);
                    }}
                    title="Select parent"
                  >
                    <CornerLeftUp size={12} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHidden(node.id);
                  }}
                  title={hidden ? "Show on live site" : "Hide from live site"}
                >
                  {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(node.id);
                  }}
                  title="Duplicate"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const name = window.prompt(
                      "Save this section as a reusable block — name it:",
                    );
                    if (!name) return;
                    await api.post("/api/blocks", { name, content: node });
                    window.dispatchEvent(new Event(BLOCKS_CHANGED_EVENT));
                  }}
                  title="Save as reusable block"
                >
                  <Bookmark size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node.id);
                  }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
            {hidden && (
              <div
                className="absolute z-30 bg-slate-900/80 text-white text-[10px] rounded px-1.5 py-0.5 flex items-center gap-1 pointer-events-none"
                style={{ top: box.top + 4, right: box.right + 4 }}
              >
                <EyeOff size={10} /> Hidden
              </div>
            )}
            {/* Drag-to-resize handles — only for the selected node, not locked structural
                slots. Right edge drags width (style.maxWidth), bottom edge drags height
                (style.minHeight), the corner drags both. */}
            {/* Live dimensions readout while dragging a resize handle. */}
            {isResizing && (
              <div
                className="absolute z-40 bg-slate-900 text-white text-[11px] font-mono rounded px-1.5 py-0.5 pointer-events-none"
                style={{
                  top: box.top + box.height + 6,
                  left: box.left + box.width / 2 - 40,
                }}
              >
                {Math.round(box.width)} × {Math.round(box.height)} px
              </div>
            )}
            {!def?.locked && selected && (
              <>
                <div
                  onPointerDown={startResize("width")}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute z-30 pointer-events-auto cursor-ew-resize flex items-center justify-end pr-0.5"
                  // Kept fully inside the box's right edge rather than straddling it —
                  // centering exactly on the boundary pixel makes the hit-test a coin
                  // flip against whatever sits just outside (e.g. the Inspector panel).
                  style={{
                    top: box.top + box.height / 2 - 10,
                    left: box.left + box.width - 10,
                    width: 10,
                    height: 20,
                  }}
                  title="Drag to resize width"
                >
                  <div className="w-1.5 h-5 rounded-full bg-blue-500 border border-white shadow" />
                </div>
                <div
                  onPointerDown={startResize("height")}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute z-30 pointer-events-auto cursor-ns-resize flex items-end justify-center pb-0.5"
                  style={{
                    top: box.top + box.height - 10,
                    left: box.left + box.width / 2 - 10,
                    width: 20,
                    height: 10,
                  }}
                  title="Drag to resize height"
                >
                  <div className="h-1.5 w-5 rounded-full bg-blue-500 border border-white shadow" />
                </div>
                <div
                  onPointerDown={startResize("both")}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute z-30 pointer-events-auto cursor-nwse-resize w-4 h-4 rounded-sm bg-blue-500 border-2 border-white shadow"
                  style={{
                    top: box.top + box.height - 8,
                    left: box.left + box.width - 8,
                  }}
                  title="Drag to resize"
                />
              </>
            )}
          </>,
          overlayEl,
        )}
    </div>
  );
}
