"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import type { SectionProps } from "./types";

type TabItem = { label: string; content: string };
type Transition = "none" | "fade" | "slide";

export function Tabs({ node }: SectionProps) {
  const items = (node.props.items as TabItem[]) ?? [];
  const transition = ((node.props.tabTransition as Transition) || "fade") as Transition;
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Animate the panel in whenever the active tab changes — not an entrance animation
  // (that's the universal per-section one from useEntranceAnimation), this is a
  // click-triggered content-switch transition scoped to this component.
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = panelRef.current;
    if (!el || transition === "none") return;
    const ctx = gsap.context(() => {
      if (transition === "fade") {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      } else {
        gsap.fromTo(el, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" });
      }
    });
    return () => ctx.revert();
  }, [active, transition]);

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {items.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors " +
              (active === i ? "border-theme-primary text-theme-primary" : "border-transparent opacity-60 hover:opacity-100")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div ref={panelRef} className="prose py-6" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(items[active]?.content ?? "") }} />
    </div>
  );
}
