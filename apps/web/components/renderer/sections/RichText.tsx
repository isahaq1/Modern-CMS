import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import type { SectionProps } from "./types";

export function RichText({ node }: SectionProps) {
  const html = (node.props.html as string) ?? "";
  return <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }} />;
}
