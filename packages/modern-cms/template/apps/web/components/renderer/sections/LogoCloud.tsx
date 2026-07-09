import type { CSSProperties } from "react";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type Logo = { image?: string; name?: string; href?: string };

function LogoImage({ logo, grayscale }: { logo: Logo; grayscale: boolean }) {
  if (!logo.image) return null;
  const img = (
    <div className="relative h-10 w-28 shrink-0">
      <CmsImage
        src={logo.image}
        alt={logo.name ?? ""}
        fill
        className={`object-contain transition-all ${grayscale ? "grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : ""}`}
      />
    </div>
  );
  return logo.href ? (
    <a href={logo.href} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  ) : (
    img
  );
}

// The static-grid sibling of Marquee — a plain, evenly spaced row/wrap of partner
// logos. The "scroll" layout reuses Marquee's own .pgcms-marquee CSS (globals.css)
// rather than duplicating the keyframe animation.
export function LogoCloud({ node }: SectionProps) {
  const heading = node.props.heading as string;
  const logos = (node.props.logos as Logo[]) ?? [];
  const layout = (node.props.layout as string) || "grid";
  const grayscale = node.props.grayscale !== false;

  if (logos.length === 0) return null;

  return (
    <div>
      {heading && <p className="text-sm font-medium uppercase tracking-wide opacity-60 text-center mb-6">{heading}</p>}
      {layout === "scroll" ? (
        <div className="pgcms-marquee">
          <div
            className="pgcms-marquee-track gap-12 pr-12"
            data-pause-on-hover="true"
            style={{ "--pgcms-marquee-duration": "24s", "--pgcms-marquee-direction": "normal" } as CSSProperties}
          >
            {[0, 1].map((copy) => (
              <div key={copy} className="inline-flex items-center gap-12" aria-hidden={copy === 1}>
                {logos.map((logo, i) => (
                  <LogoImage key={i} logo={logo} grayscale={grayscale} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-10">
          {logos.map((logo, i) => (
            <LogoImage key={i} logo={logo} grayscale={grayscale} />
          ))}
        </div>
      )}
    </div>
  );
}
