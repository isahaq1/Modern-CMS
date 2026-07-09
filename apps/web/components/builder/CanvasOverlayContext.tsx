"use client";

import { createContext, useContext } from "react";

/**
 * The scrollable canvas content area that floating toolbar chips portal into.
 *
 * Nesting a `position: absolute` toolbar deep inside the node tree isn't safe here:
 * every node's wrapper carries dnd-kit's `transition`/`transform` styling for drag
 * animation, and Chromium promotes elements like that to their own compositing layer
 * whenever they're present — even at rest. That traps a nested toolbar's z-index
 * inside its ancestor's layer instead of letting it win against sibling content
 * elsewhere in the header/container (confirmed via document.elementFromPoint showing
 * an unrelated ancestor div swallowing clicks meant for a deeply nested button).
 * Portaling into one flat layer that sits alongside the scrollable content sidesteps
 * the whole class of stacking bugs.
 */
export const CanvasOverlayContext = createContext<HTMLDivElement | null>(null);

export function useCanvasOverlay() {
  return useContext(CanvasOverlayContext);
}
