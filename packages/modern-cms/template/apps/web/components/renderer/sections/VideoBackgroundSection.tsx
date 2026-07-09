import { Button } from "./Button";
import type { SectionProps } from "./types";

/** The video + overlay layers themselves now render universally for every node type
 * (see NodeBackgroundLayers) — this component only lays out the built-in content and
 * any child components dropped into the section. */
export function VideoBackgroundSection({ node, children }: SectionProps) {
  const { heading, subheading, buttonText, buttonHref } = node.props as Record<string, string>;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[inherit] text-center gap-4">
      <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
        {heading && <h2 className="text-3xl md:text-4xl font-bold">{heading}</h2>}
        {subheading && <p className="text-lg opacity-90">{subheading}</p>}
        {buttonText && <Button text={buttonText} href={buttonHref || "#"} variant="primary" />}
      </div>
      {children && <div className="w-full">{children}</div>}
    </div>
  );
}
