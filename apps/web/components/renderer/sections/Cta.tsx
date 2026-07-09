import { Button } from "./Button";
import type { SectionProps } from "./types";

export function Cta({ node, children }: SectionProps) {
  const { heading, subheading, buttonText, buttonHref } = node.props as Record<string, string>;

  return (
    <div className="flex flex-col items-center gap-4">
      {heading && <h2 className="text-3xl font-bold">{heading}</h2>}
      {subheading && <p className="text-lg opacity-90">{subheading}</p>}
      {buttonText && <Button text={buttonText} href={buttonHref || "#"} variant="secondary" />}
      {children && <div className="w-full">{children}</div>}
    </div>
  );
}
