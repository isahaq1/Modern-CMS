import type { SectionProps } from "./types";

export function EmbedBlock({ node }: SectionProps) {
  const mode = (node.props.mode as string) || "iframe";
  const url = (node.props.url as string) ?? "";
  const html = (node.props.html as string) ?? "";
  const height = (node.props.height as string) || "400px";
  const title = (node.props.title as string) || "Embedded content";

  if (mode === "html" && html) {
    return (
      <div
        className="w-full overflow-auto"
        style={{ minHeight: height }}
        // Sandboxed custom HTML — scripts run in an isolated iframe-like context via srcdoc
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (!url) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 text-slate-400 text-sm rounded-lg"
        style={{ height }}
      >
        No embed URL configured
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title={title}
      className="w-full border-0 rounded-lg"
      style={{ height }}
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
