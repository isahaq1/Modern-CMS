import clsx from "clsx";
import type { SectionProps } from "./types";

export function NavZone({ node, children }: SectionProps) {
  const zone = (node.props.zone as string) ?? "start";

  return (
    <div
      className={clsx(
        "flex items-center gap-4 flex-wrap min-w-0",
        zone === "start" && "justify-start",
        zone === "middle" && "flex-1 justify-center",
        zone === "end" && "justify-end"
      )}
    >
      {children}
    </div>
  );
}
