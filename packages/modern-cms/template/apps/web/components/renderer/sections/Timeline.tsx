import type { SectionProps } from "./types";

type TimelineItem = { date?: string; title: string; description?: string };

export function Timeline({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const items = (node.props.items as TimelineItem[]) ?? [];

  if (items.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{heading}</h2>}
      <div className="relative max-w-2xl mx-auto pl-8">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-200" aria-hidden="true" />
        <div className="flex flex-col gap-8">
          {items.map((item, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-8 top-1 w-3.5 h-3.5 rounded-full bg-theme-primary border-2 border-white shadow" />
              {item.date && <div className="text-xs font-semibold uppercase tracking-wide text-theme-primary mb-1">{item.date}</div>}
              <h3 className="font-semibold">{item.title}</h3>
              {item.description && <p className="text-sm opacity-75 mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
