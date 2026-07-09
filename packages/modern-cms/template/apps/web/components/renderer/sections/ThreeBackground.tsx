"use client";

import { useRef } from "react";
import { useThreeBackgroundScene, type ThreeBackgroundPreset } from "@/lib/threeBackgroundScene";
import { Button } from "./Button";
import type { SectionProps } from "./types";

export function ThreeBackground({ node, children }: SectionProps) {
  const { heading, subheading, buttonText, buttonHref } = node.props as Record<string, string>;
  // Default true: pages built before the toggle existed have no `enabled` prop and
  // should keep animating exactly as they did.
  const enabled = node.props.enabled !== false;
  const preset = ((node.props.preset as ThreeBackgroundPreset) || "particles") as ThreeBackgroundPreset;
  const color = (node.props.color as string) || "#2563eb";
  const secondColor = (node.props.secondColor as string) || "";
  const density = Number(node.props.density) || 80;
  const speed = Number(node.props.speed) || 1;
  const mouseFollow = node.props.mouseFollow === true;
  const bgOpacity = node.props.bgOpacity !== undefined ? Number(node.props.bgOpacity) : 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useThreeBackgroundScene(canvasRef, containerRef, enabled, {
    preset,
    color,
    secondColor: secondColor || undefined,
    density,
    speed,
    mouseFollow,
  });

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center h-full min-h-[inherit] text-center gap-4 overflow-hidden">
      {enabled && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: bgOpacity }} />}
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl mx-auto">
        {heading && <h2 className="text-3xl md:text-4xl font-bold">{heading}</h2>}
        {subheading && <p className="text-lg opacity-90">{subheading}</p>}
        {buttonText && <Button text={buttonText} href={buttonHref || "#"} variant="primary" />}
        {children && <div className="w-full">{children}</div>}
      </div>
    </div>
  );
}
