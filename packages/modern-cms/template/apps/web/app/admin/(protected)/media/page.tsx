"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Copy, Search, Check } from "lucide-react";
import type { MediaAsset } from "@pgcms/shared";
import { api } from "@/lib/api";

type AssetWithMeta = MediaAsset & { filename?: string; alt?: string | null };

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<AssetWithMeta[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [altSavedId, setAltSavedId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function refresh(query = search) {
    api
      .get<AssetWithMeta[]>(`/api/media${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`)
      .then(setAssets);
  }

  // Debounced server-side search across filename, alt text, and storage key.
  useEffect(() => {
    const t = setTimeout(() => refresh(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post<MediaAsset>("/api/media", formData);
      }
      refresh();
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this media asset?")) return;
    await api.delete(`/api/media/${id}`);
    refresh();
  }

  async function saveAlt(asset: AssetWithMeta) {
    const draft = altDrafts[asset.id];
    if (draft === undefined || draft === (asset.alt ?? "")) return;
    await api.put(`/api/media/${asset.id}`, { alt: draft });
    setAltSavedId(asset.id);
    setTimeout(() => setAltSavedId((cur) => (cur === asset.id ? null : cur)), 1500);
    refresh();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold shrink-0">Media Library</h1>
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or alt text…"
            className="w-full border rounded-md pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          <Upload size={16} /> {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {assets?.length === 0 && (
          <div className="col-span-full text-sm text-slate-400 py-10 text-center">
            {search ? "Nothing matches that search." : "No media uploaded yet."}
          </div>
        )}
        {assets?.map((asset) => (
          <div key={asset.id} className="border rounded-lg overflow-hidden bg-white flex flex-col">
            <div className="aspect-square bg-slate-50 group relative">
              {asset.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt={asset.alt ?? ""} className="w-full h-full object-cover" />
              ) : (
                <video src={asset.url} className="w-full h-full object-cover" muted />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => copyUrl(asset.url)} className="bg-white rounded-full p-2" title="Copy URL">
                  <Copy size={14} />
                </button>
                <button onClick={() => remove(asset.id)} className="bg-white rounded-full p-2 text-red-600" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {asset.filename && <div className="text-[11px] text-slate-400 truncate" title={asset.filename}>{asset.filename}</div>}
              <div className="flex items-center gap-1">
                <input
                  value={altDrafts[asset.id] ?? asset.alt ?? ""}
                  onChange={(e) => setAltDrafts((prev) => ({ ...prev, [asset.id]: e.target.value }))}
                  onBlur={() => saveAlt(asset)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  placeholder="Alt text…"
                  className="w-full border rounded px-1.5 py-1 text-xs"
                />
                {altSavedId === asset.id && <Check size={13} className="text-green-600 shrink-0" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
