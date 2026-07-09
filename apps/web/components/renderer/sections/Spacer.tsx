import type { SectionProps } from "./types";

/** Pure vertical whitespace — a "break" between two sections that don't otherwise need
 * padding of their own. Purely visual: no border, no background. */
export function Spacer({ node }: SectionProps) {
  const height = (node.props.height as string) || "48px";
  return <div style={{ height }} aria-hidden="true" />;
}
