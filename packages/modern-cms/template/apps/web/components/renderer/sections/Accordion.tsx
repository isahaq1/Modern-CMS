"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SectionProps } from "./types";

type AccordionItem = { question: string; answer: string };

export function Accordion({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const items = (node.props.items as AccordionItem[]) ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{heading}</h2>}
      <div className="divide-y border rounded-lg">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium"
                aria-expanded={open}
              >
                <span>{item.question}</span>
                <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && <div className="px-5 pb-4 text-sm opacity-80">{item.answer}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
