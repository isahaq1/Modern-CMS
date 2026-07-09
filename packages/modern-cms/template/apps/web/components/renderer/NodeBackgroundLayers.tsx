import type { NodeStyle } from "@pgcms/shared";

/** Whether a node's style needs the layered-background treatment (video and/or a
 * tint overlay). A plain background image needs no layer — nodeStyleToCss handles it
 * as CSS background-image — so image-only sections skip the extra wrapper. */
export function hasBackgroundLayers(style: NodeStyle): boolean {
  return Boolean(style.backgroundVideo || style.backgroundOverlay);
}

/** Absolute-positioned background media layers for a section: looping muted video,
 * then a tint overlay above it. Rendered inside the section element (which is always
 * position: relative via nodeStyleToCss); the section's content must sit in a
 * `position: relative` wrapper to paint above these. Works on ANY node type — this is
 * what lets one section combine an image background (CSS), a video, an overlay, and
 * arbitrary child components at once. */
export function NodeBackgroundLayers({ style }: { style: NodeStyle }) {
  if (!hasBackgroundLayers(style)) return null;
  return (
    <>
      {style.backgroundVideo && (
        <video
          src={style.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {style.backgroundOverlay && (
        <div className="absolute inset-0" style={{ backgroundColor: style.backgroundOverlay }} />
      )}
    </>
  );
}
