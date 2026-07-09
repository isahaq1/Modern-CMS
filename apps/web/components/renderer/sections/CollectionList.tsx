"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { CollectionItemSummary } from "@pgcms/shared";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

/** Card grid over a collection's published items — the dynamic sibling of the static
 * Card Grid block. Point it at a collection slug and it stays current as items are
 * published, newest first, each card linking to /{collection}/{item}. */
export function CollectionList({ node }: SectionProps) {
  const collectionSlug = (node.props.collectionSlug as string) || "";
  const columns = Math.max(1, Math.min(4, Number(node.props.columns) || 3));
  const limit = Math.max(1, Math.min(50, Number(node.props.limit) || 6));
  const showExcerpt = node.props.showExcerpt !== false;
  const showDate = node.props.showDate !== false;

  const [items, setItems] = useState<CollectionItemSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!collectionSlug) return;
    fetch(`/api/collections/public/${collectionSlug}/items?limit=${limit}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setItems)
      .catch(() => setError(true));
  }, [collectionSlug, limit]);

  if (!collectionSlug) {
    return (
      <div className="h-24 flex items-center justify-center bg-slate-100 text-slate-400 text-sm rounded-lg">
        Set a collection slug in the Inspector (e.g. &quot;blog&quot;)
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-24 flex items-center justify-center bg-slate-100 text-slate-400 text-sm rounded-lg">
        Collection &quot;{collectionSlug}&quot; not found
      </div>
    );
  }
  if (items === null) {
    return <div className="h-24 animate-pulse bg-slate-100 rounded-lg" />;
  }
  if (items.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center bg-slate-100 text-slate-400 text-sm rounded-lg">
        No published items in &quot;{collectionSlug}&quot; yet
      </div>
    );
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <a
          key={item.slug}
          href={`/${collectionSlug}/${item.slug}`}
          className="flex flex-col rounded-lg border overflow-hidden bg-white hover:shadow-md transition-shadow"
        >
          {item.coverImage ? (
            <div className="relative w-full h-40">
              <CmsImage src={item.coverImage} alt={item.title} fill className="object-cover" sizes={`(max-width: 768px) 100vw, ${Math.round(100 / columns)}vw`} />
            </div>
          ) : (
            <div className="w-full h-40 bg-slate-100" />
          )}
          <div className="flex flex-col gap-2 p-4 flex-1">
            {showDate && item.publishedAt && (
              <span className="text-xs opacity-60">{new Date(item.publishedAt).toLocaleDateString()}</span>
            )}
            <h3 className="font-semibold">{item.title}</h3>
            {showExcerpt && item.excerpt && <p className="text-sm opacity-75 flex-1">{item.excerpt}</p>}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-theme-primary mt-auto">
              Read more <ArrowRight size={14} />
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
