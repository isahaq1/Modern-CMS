"use client";

import { useRef } from "react";
import { Button } from "@/components/renderer/sections/Button";
import { useThreeBackgroundScene, type ThreeBackgroundPreset } from "@/lib/threeBackgroundScene";
import type { SectionProps } from "./types";

const THREE_PRESETS = new Set(["particles", "waves", "shapes", "stars", "network", "rings"]);

export function Hero({ node, children }: SectionProps) {
  const { heading, subheading, primaryButtonText, primaryButtonHref, secondaryButtonText, secondaryButtonHref } =
    node.props as Record<string, string>;
  // A separate on/off switch rather than folding "off" into the preset list — flipping
  // this back on always restores whichever style/colors/speed were last configured,
  // instead of losing them the moment "None" was picked.
  const enabled = node.props.backgroundAnimationEnabled === true;
  const preset = (node.props.preset as string) || "gradient";
  const accentColor = (node.props.accentColor as string) || "#60a5fa";
  const secondColor = (node.props.secondColor as string) || "#0f172a";
  const gradientAngle = Number(node.props.gradientAngle) || 135;
  const gradientAnimated = node.props.gradientAnimated === true;
  const density = Number(node.props.density) || 80;
  const speed = Number(node.props.speed) || 1;
  const mouseFollow = node.props.mouseFollow === true;
  const bgOpacity = node.props.bgOpacity !== undefined ? Number(node.props.bgOpacity) : 1;
  const is3D = enabled && THREE_PRESETS.has(preset);
  const isGradient = enabled && preset === "gradient";

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useThreeBackgroundScene(canvasRef, containerRef, is3D, {
    preset: (is3D ? preset : "particles") as ThreeBackgroundPreset,
    color: accentColor,
    secondColor,
    density,
    speed,
    mouseFollow,
  });

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-6 overflow-hidden h-full min-h-[inherit]">
      {isGradient && (
        <div
          className={gradientAnimated ? "absolute inset-0 pgcms-animated-gradient" : "absolute inset-0"}
          style={{
            // The animated variant needs a third stop so the drifting background-position
            // has somewhere to travel — A → B → A reads as a continuous color sweep.
            background: gradientAnimated
              ? `linear-gradient(${gradientAngle}deg, ${accentColor}, ${secondColor}, ${accentColor})`
              : `linear-gradient(${gradientAngle}deg, ${accentColor}, ${secondColor})`,
            opacity: bgOpacity,
          }}
        />
      )}
      {is3D && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: bgOpacity }} />}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {heading && <h1 className="text-4xl md:text-5xl font-bold">{heading}</h1>}
        {subheading && <p className="text-lg opacity-90">{subheading}</p>}
        {(primaryButtonText || secondaryButtonText) && (
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            {primaryButtonText && (
              <Button text={primaryButtonText} href={primaryButtonHref || "#"} variant="primary" />
            )}
            {secondaryButtonText && (
              <Button text={secondaryButtonText} href={secondaryButtonHref || "#"} variant="outline" />
            )}
          </div>
        )}
        {children && <div className="w-full">{children}</div>}
      </div>
    </div>
  );
}
