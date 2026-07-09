"use client";

import * as LucideIcons from "lucide-react";
import { useEffect, useState } from "react";
import { nodeStyleToCss } from "@/lib/style";
import type { SectionProps } from "./types";

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-xl",
  lg: "w-16 h-16 text-2xl"
} as const;

export function GoToTop({ node }: SectionProps) {
  const enabled = node.props.enabled !== false;
  const [visible, setVisible] = useState(false);
  const showAfterScroll = Number(node.props.showAfterScroll) || 300;
  const iconName = (node.props.icon as string) || "ArrowUp";
  const size = (node.props.size as keyof typeof SIZE_CLASSES) || "md";
  const css = nodeStyleToCss(node.style, true);

  const Icon = (LucideIcons as any)[iconName] || LucideIcons.ArrowUp;

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      setVisible(window.scrollY > showAfterScroll);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled, showAfterScroll]);

  const goToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  if (!enabled) return null;

  return (
    <button
      onClick={goToTop}
      className={`fixed bottom-8 right-8 z-50 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${SIZE_CLASSES[size]} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
      style={css}
    >
      <Icon size="1em" />
    </button>
  );
}
