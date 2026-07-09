"use client";

import { useEffect, useRef, useState } from "react";
import type { SectionProps } from "./types";

type StatItem = { value: string; label: string };

/** Splits "500+" -> {prefix:"", number:500, suffix:"+"}, or "$2M" -> {prefix:"$", number:2, suffix:"M"}.
 * Falls back to a null number (no animation, just display the raw string) when unparseable. */
function parseValue(raw: string) {
  const match = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)([^\d]*)$/);
  if (!match) return { prefix: "", number: null as number | null, suffix: raw };
  return { prefix: match[1], number: Number(match[2]), suffix: match[3] };
}

function StatValue({ raw }: { raw: string }) {
  const { prefix, number, suffix } = parseValue(raw);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(number === null ? raw : 0);

  useEffect(() => {
    if (number === null || !ref.current) return;
    const el = ref.current;
    const target = number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const duration = 1200;
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / duration);
          setDisplay(Math.round(target * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [number]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function Stats({ node }: SectionProps) {
  const items = (node.props.items as StatItem[]) ?? [];
  const columns = Math.max(2, Math.min(4, Number(node.props.columns) || 3));

  if (items.length === 0) return null;

  return (
    <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <StatValue raw={item.value} />
          <span className="text-sm opacity-75">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
