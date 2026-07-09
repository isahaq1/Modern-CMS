"use client";

import { createContext, useContext } from "react";
import type { Breakpoint } from "@pgcms/shared";

/** Which breakpoint the builder is currently previewing/editing. Every canvas node
 * renders its device-effective style, and every style edit is written into that
 * device's override layer (see handleChangeStyle in the builder page). */
export const BuilderDeviceContext = createContext<Breakpoint>("desktop");

export function useBuilderDevice() {
  return useContext(BuilderDeviceContext);
}
