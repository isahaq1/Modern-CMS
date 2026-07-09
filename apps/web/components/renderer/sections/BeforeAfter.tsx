"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

// A pointer-drag reveal slider: the "before" image sits on top, clipped to `percent`
// width, so dragging the handle reveals more/less of the "after" image underneath.
// Simpler cousin of BuilderCanvasNode's resize handles — one axis, no unit juggling.
export function BeforeAfter({ node }: SectionProps) {
  const beforeImage = (node.props.beforeImage as string) || "";
  const afterImage = (node.props.afterImage as string) || "";
  const beforeLabel = (node.props.beforeLabel as string) || "Before";
  const afterLabel = (node.props.afterLabel as string) || "After";
  const [percent, setPercent] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPercent(Math.max(0, Math.min(100, next)));
  }, []);

  if (!beforeImage || !afterImage) {
    return (
      <div className="h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-sm rounded-lg">
        Add a before and an after image
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-lg overflow-hidden select-none touch-none"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) updateFromClientX(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
    >
      <CmsImage src={afterImage} alt={afterLabel} fill className="object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${percent}%` }}>
        <div className="relative h-full" style={{ width: containerWidth || "100%" }}>
          <CmsImage src={beforeImage} alt={beforeLabel} fill className="object-cover" />
        </div>
      </div>
      <div className="absolute inset-y-0 bg-white/80 w-0.5 pointer-events-none" style={{ left: `${percent}%` }}>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-slate-700">
          <MoveHorizontal size={16} />
        </span>
      </div>
      <span className="absolute top-3 left-3 text-xs font-semibold bg-black/50 text-white px-2 py-1 rounded">{beforeLabel}</span>
      <span className="absolute top-3 right-3 text-xs font-semibold bg-black/50 text-white px-2 py-1 rounded">{afterLabel}</span>
    </div>
  );
}
