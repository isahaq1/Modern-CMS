"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type Slide = { image: string; heading?: string; subheading?: string; buttonText?: string; buttonHref?: string };

export function Slider({ node }: SectionProps) {
  const slides = (node.props.slides as Slide[]) ?? [];
  const autoplay = node.props.autoplay !== false;
  const intervalMs = Number(node.props.intervalMs) || 5000;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(id);
  }, [autoplay, intervalMs, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
        No slides added yet
      </div>
    );
  }

  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <div className="relative w-full h-full min-h-[inherit] overflow-hidden">
      {slide.image && <CmsImage src={slide.image} alt={slide.heading ?? ""} fill className="object-cover" />}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[480px] gap-4 px-6 text-center">
        {slide.heading && <h2 className="text-3xl md:text-4xl font-bold">{slide.heading}</h2>}
        {slide.subheading && <p className="text-lg opacity-90">{slide.subheading}</p>}
        {slide.buttonText && <Button text={slide.buttonText} href={slide.buttonHref || "#"} variant="primary" />}
      </div>
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + slides.length) % slides.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 rounded-full p-2"
            aria-label="Previous slide"
          >
            <ChevronLeft className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % slides.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 rounded-full p-2"
            aria-label="Next slide"
          >
            <ChevronRight className="text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
