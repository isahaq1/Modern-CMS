"use client";

import { createContext, useContext } from "react";

export type RendererMode = "view" | "edit";

export type RendererContextValue = {
  mode: RendererMode;
  selectedId: string | null;
  onSelect?: (id: string) => void;
};

export const RendererContext = createContext<RendererContextValue>({
  mode: "view",
  selectedId: null,
});

export function useRendererContext() {
  return useContext(RendererContext);
}
