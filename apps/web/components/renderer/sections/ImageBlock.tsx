import Image from "next/image";
import type { SectionProps } from "./types";

export function ImageBlock({ node }: SectionProps) {
  const src = (node.props.src as string) ?? "";
  const alt = (node.props.alt as string) ?? "";
  const caption = (node.props.caption as string) ?? "";
  const imgWidth = (node.props.imgWidth as string) || undefined;
  const imgHeight = (node.props.imgHeight as string) || undefined;
  const align = (node.props.align as string) || "center";

  if (!src) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
        No image selected
      </div>
    );
  }

  const useOptimized = src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");

  return (
    <figure className={align === "center" ? "flex flex-col items-center" : align === "right" ? "flex flex-col items-end" : "flex flex-col items-start"}>
      {useOptimized ? (
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          className="rounded-lg max-w-full h-auto"
          style={{
            width: imgWidth || "100%",
            height: imgHeight || "auto",
            maxWidth: "100%",
            objectFit: imgHeight ? "cover" : undefined,
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="rounded-lg max-w-full"
          style={{
            width: imgWidth || "100%",
            height: imgHeight || "auto",
            objectFit: imgHeight ? "cover" : undefined,
          }}
        />
      )}
      {caption && <figcaption className="text-sm opacity-70 mt-2 text-center">{caption}</figcaption>}
    </figure>
  );
}
