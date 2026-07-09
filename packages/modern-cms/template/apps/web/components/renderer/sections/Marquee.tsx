import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type MarqueeItem = { text?: string; image?: string };

export function Marquee({ node }: SectionProps) {
  const items = (node.props.items as MarqueeItem[]) ?? [];
  const speed = Math.max(4, Number(node.props.speed) || 20);
  const direction = (node.props.direction as string) === "right" ? "reverse" : "normal";
  const pauseOnHover = node.props.pauseOnHover !== false;

  if (items.length === 0) return null;

  // Two copies of the item list; the track translates by -50% and loops seamlessly.
  const copies = [0, 1];

  return (
    <div className="pgcms-marquee">
      <div
        className="pgcms-marquee-track gap-12 pr-12"
        data-pause-on-hover={pauseOnHover}
        style={
          {
            "--pgcms-marquee-duration": `${speed}s`,
            "--pgcms-marquee-direction": direction,
          } as React.CSSProperties
        }
      >
        {copies.map((copy) => (
          <div key={copy} className="inline-flex items-center gap-12" aria-hidden={copy === 1}>
            {items.map((item, i) =>
              item.image ? (
                <CmsImage key={i} src={item.image} alt={item.text ?? ""} width={160} height={40} className="h-10 w-auto opacity-80" style={{ height: "2.5rem", width: "auto" }} />
              ) : (
                <span key={i} className="text-lg font-semibold opacity-70 whitespace-nowrap">
                  {item.text}
                </span>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
