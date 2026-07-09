import { Button } from "./Button";
import type { SectionProps } from "./types";

type ButtonItem = {
  text: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
  border?: "default" | "none" | "solid";
  size?: "sm" | "md" | "lg";
};

export function ButtonGroup({ node }: SectionProps) {
  const buttons = (node.props.buttons as ButtonItem[]) ?? [];

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {buttons.map((btn, i) => (
        <Button key={i} text={btn.text} href={btn.href} variant={btn.variant} border={btn.border} size={btn.size} />
      ))}
    </div>
  );
}
