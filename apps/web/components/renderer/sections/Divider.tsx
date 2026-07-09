import type { CSSProperties } from "react";
import type { SectionProps } from "./types";

export function Divider({ node }: SectionProps) {
  const lineStyle = (node.props.lineStyle as string) || "solid";
  const thickness = (node.props.thickness as string) || "1px";
  const color = (node.props.color as string) || "#e2e8f0";
  const width = (node.props.width as string) || "100%";

  return (
    <div className="flex justify-center">
      <hr
        style={
          {
            width,
            border: "none",
            borderTopWidth: thickness,
            borderTopStyle: lineStyle,
            borderTopColor: color,
            margin: 0,
          } as CSSProperties
        }
      />
    </div>
  );
}
