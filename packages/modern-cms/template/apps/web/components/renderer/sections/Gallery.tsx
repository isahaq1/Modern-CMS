import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type GalleryImage = { src: string; alt?: string };

export function Gallery({ node }: SectionProps) {
  const images = (node.props.images as GalleryImage[]) ?? [];
  const columns = Math.max(1, Math.min(6, Number(node.props.columns) || 3));

  if (images.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
        No images added yet
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {images.map((img, i) => (
        <div key={i} className="relative w-full h-40 rounded-lg overflow-hidden">
          <CmsImage src={img.src} alt={img.alt ?? ""} fill className="object-cover" sizes={`${Math.round(100 / columns)}vw`} />
        </div>
      ))}
    </div>
  );
}
