import { ArrowRight } from "lucide-react";
import { IconRenderer } from "@/components/builder/IconRenderer";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type Card = { image?: string; icon?: string; title: string; excerpt?: string; buttonText?: string; href: string };

export function CardGrid({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const cards = (node.props.cards as Card[]) ?? [];
  const columns = Math.max(1, Math.min(4, Number(node.props.columns) || 3));
  const imageHeight = (node.props.imageHeight as string) || "160px";

  return (
    <div>
      {heading && <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{heading}</h2>}
      {cards.length === 0 ? (
        <div className="h-32 flex items-center justify-center bg-slate-100 text-slate-400 text-sm rounded-lg">
          No cards added yet
        </div>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {cards.map((card, i) =>
            card.image ? (
              <a
                key={i}
                href={card.href || "#"}
                className="flex flex-col rounded-lg border overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                <div className="relative w-full" style={{ height: imageHeight }}>
                  <CmsImage src={card.image} alt={card.title} fill className="object-cover" sizes={`(max-width: 768px) 100vw, ${Math.round(100 / columns)}vw`} />
                </div>
                <div className="flex flex-col gap-2 p-4 flex-1">
                  <h3 className="font-semibold">{card.title}</h3>
                  {card.excerpt && <p className="text-sm opacity-75 flex-1">{card.excerpt}</p>}
                  {card.buttonText && (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-theme-primary mt-auto">
                      {card.buttonText} <ArrowRight size={14} />
                    </span>
                  )}
                </div>
              </a>
            ) : (
              // No image — a lighter, icon-led tile (or plain text if no icon either),
              // rather than a placeholder gray box that implies a missing asset.
              <a key={i} href={card.href || "#"} className="flex flex-col items-center text-center gap-2 px-2 py-4 group">
                {card.icon && (
                  <span className="w-14 h-14 rounded-full bg-theme-primary/10 text-theme-primary flex items-center justify-center mb-1 group-hover:bg-theme-primary/20 transition-colors">
                    <IconRenderer name={card.icon} size={24} />
                  </span>
                )}
                <h3 className="font-semibold">{card.title}</h3>
                {card.excerpt && <p className="text-sm opacity-75">{card.excerpt}</p>}
                {card.buttonText && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-theme-primary mt-1">
                    {card.buttonText} <ArrowRight size={14} />
                  </span>
                )}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
