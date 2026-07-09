"use client";

import { useState, useCallback } from "react";
import { Search as SearchIcon } from "lucide-react";
import type { SectionProps } from "./types";

type SearchResult = { type: "page" | "collection"; title: string; url: string; excerpt: string | null };

export function SiteSearch({ node }: SectionProps) {
  const heading = (node.props.heading as string) || "Search";
  const placeholder = (node.props.placeholder as string) || "Search this site…";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-xl mx-auto w-full">
      {heading && <h2 className="text-2xl font-bold mb-4 text-center">{heading}</h2>}
      <div className="relative">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            void runSearch(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm bg-white text-slate-900"
          aria-label={placeholder}
        />
      </div>
      {loading && <p className="text-sm text-center opacity-60 mt-3">Searching…</p>}
      {results !== null && !loading && (
        <ul className="mt-4 space-y-2">
          {results.length === 0 && <li className="text-sm text-center opacity-60">No results found.</li>}
          {results.map((r) => (
            <li key={r.url}>
              <a href={r.url} className="block border rounded-lg px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="font-medium">{r.title}</div>
                {r.excerpt && <div className="text-sm opacity-70 line-clamp-2 mt-0.5">{r.excerpt}</div>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
