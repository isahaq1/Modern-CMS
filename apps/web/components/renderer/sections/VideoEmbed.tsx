"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

type ParsedVideo = { provider: "youtube" | "vimeo" | "mp4" | null; embedUrl?: string; id?: string };

function parseVideoUrl(url: string): ParsedVideo {
  if (!url) return { provider: null };
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) return { provider: "youtube", id: yt[1], embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1` };
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return { provider: "vimeo", id: vim[1], embedUrl: `https://player.vimeo.com/video/${vim[1]}?autoplay=1` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { provider: "mp4" };
  return { provider: null };
}

// Renders a static thumbnail + play button instead of an always-live iframe, so a page
// with several videos doesn't pay YouTube/Vimeo's heavy embed script cost until a
// visitor actually presses play.
export function VideoEmbed({ node }: SectionProps) {
  const url = (node.props.url as string) || "";
  const customThumbnail = (node.props.thumbnail as string) || "";
  const aspectRatio = (node.props.aspectRatio as string) || "16/9";
  const [playing, setPlaying] = useState(false);
  const parsed = parseVideoUrl(url);

  if (!url || !parsed.provider) {
    return (
      <div className="h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-sm rounded-lg">
        Add a YouTube, Vimeo, or direct MP4 URL
      </div>
    );
  }

  if (parsed.provider === "mp4") {
    return (
      <div className="rounded-lg overflow-hidden" style={{ aspectRatio }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={url} controls className="w-full h-full object-cover" />
      </div>
    );
  }

  const thumbnail =
    customThumbnail || (parsed.provider === "youtube" ? `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg` : "");

  return (
    <div className="relative rounded-lg overflow-hidden bg-slate-900" style={{ aspectRatio }}>
      {playing ? (
        <iframe
          src={parsed.embedUrl}
          title="Video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="absolute inset-0 flex items-center justify-center group" aria-label="Play video">
          {thumbnail && <CmsImage src={thumbnail} alt="" fill className="object-cover opacity-90" />}
          <span className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white/90 group-hover:bg-white transition-colors">
            <Play size={28} className="text-slate-900 ml-1" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
