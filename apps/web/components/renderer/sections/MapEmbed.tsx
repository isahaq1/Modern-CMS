import type { SectionProps } from "./types";

export function MapEmbed({ node }: SectionProps) {
  const lat = Number(node.props.lat) || 0;
  const lng = Number(node.props.lng) || 0;
  const zoom = Number(node.props.zoom) || 13;
  const customEmbedUrl = node.props.embedUrl as string;

  const src =
    customEmbedUrl ||
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.03}%2C${lng + 0.05}%2C${
      lat + 0.03
    }&layer=mapnik&marker=${lat}%2C${lng}&zoom=${zoom}`;

  return (
    <iframe
      src={src}
      className="w-full h-full min-h-[inherit] border-0"
      style={{ minHeight: "400px" }}
      loading="lazy"
      title="Map"
    />
  );
}
