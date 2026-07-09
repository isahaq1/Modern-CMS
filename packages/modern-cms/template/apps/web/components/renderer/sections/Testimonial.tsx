"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type TestimonialItem = { avatar?: string; name: string; role?: string; quote: string; rating?: number };

function Card({ item }: { item: TestimonialItem }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-6">
      {item.rating ? (
        <div className="flex gap-0.5 text-amber-400">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={16} fill={i < item.rating! ? "currentColor" : "none"} className={i < item.rating! ? "" : "opacity-30"} />
          ))}
        </div>
      ) : null}
      <p className="text-sm opacity-80 flex-1">&ldquo;{item.quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        {item.avatar && (
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
            <CmsImage src={item.avatar} alt={item.name} fill className="object-cover" />
          </div>
        )}
        <div>
          <div className="text-sm font-semibold">{item.name}</div>
          {item.role && <div className="text-xs opacity-60">{item.role}</div>}
        </div>
      </div>
    </div>
  );
}

export function Testimonial({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const items = (node.props.items as TestimonialItem[]) ?? [];
  const layout = (node.props.layout as string) || "grid";
  const columns = Math.max(1, Math.min(4, Number(node.props.columns) || 3));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (layout !== "carousel" || items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [layout, items.length]);

  if (items.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{heading}</h2>}
      {layout === "carousel" ? (
        <div className="max-w-xl mx-auto">
          <Card item={items[Math.min(index, items.length - 1)]} />
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full ${i === index ? "bg-theme-primary" : "bg-slate-300"}`}
                  aria-label={`Show testimonial ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {items.map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
