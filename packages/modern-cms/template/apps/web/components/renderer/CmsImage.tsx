import Image from "next/image";
import type { CSSProperties } from "react";

type CmsImageProps = {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** Fills a positioned ancestor (that ancestor must set its own height/aspect ratio)
   * — for cover-cropped photos (gallery tiles, card thumbnails, hero backgrounds).
   * Omit for intrinsic-aspect images (logos, inline icons) sized by `width`/`height`. */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
};

/** Generalizes ImageBlock's next/image-vs-plain-<img> decision (relative/absolute URLs
 * get Next's optimizer; anything else — a bare filename, a data URI — falls back to a
 * plain tag) so every renderer component gets optimization/lazy-loading consistently
 * instead of each reimplementing the same check. */
export function CmsImage({ src, alt = "", className, style, fill, width, height, sizes }: CmsImageProps) {
  if (!src) return null;
  const useOptimized = src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");

  if (!useOptimized) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} style={style} />;
  }

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} style={style} sizes={sizes ?? "100vw"} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 800}
      className={className}
      style={style}
      sizes={sizes}
    />
  );
}
