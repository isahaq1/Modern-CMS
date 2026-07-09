"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import clsx from "clsx";

export function DroppableChildren({
  parentId,
  childIds,
  children,
  transparent = false,
}: {
  parentId: string;
  childIds: string[];
  children: React.ReactNode;
  /**
   * When true and non-empty, the wrapper renders with `display: contents` so its
   * children (e.g. a Container's Column nodes) become direct layout children of
   * whatever CSS grid/flex the surrounding section component declares — otherwise
   * this wrapper div is the grid/flex's only item and everything collapses into one
   * cell. Left opaque while empty so it stays a real, measurable drop target (a
   * `display: contents` element has no box for dnd-kit to hit-test against).
   */
  transparent?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone:${parentId}`,
    data: { type: "container", parentId },
  });

  const isEmpty = childIds.length === 0;
  const useTransparent = transparent && !isEmpty;

  return (
    <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        style={useTransparent ? { display: "contents" } : undefined}
        className={clsx(!useTransparent && "min-h-[48px]", !useTransparent && isOver && "bg-blue-50/60")}
      >
        {isEmpty && (
          <div className="text-xs text-slate-400 border border-dashed rounded p-6 text-center m-2">
            Drop components here
          </div>
        )}
        {children}
      </div>
    </SortableContext>
  );
}
