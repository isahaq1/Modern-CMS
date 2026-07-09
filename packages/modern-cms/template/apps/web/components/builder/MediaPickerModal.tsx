"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import type { MediaAsset } from "@pgcms/shared";
import { api } from "@/lib/api";

export function MediaPickerModal({
  accept,
  onSelect,
  onClose,
}: {
  accept: "image" | "video";
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function refresh() {
    api.get<MediaAsset[]>("/api/media").then(setAssets);
  }

  useEffect(refresh, []);

  const filtered = assets?.filter((a) => (accept === "image" ? a.mimeType.startsWith("image/") : a.mimeType.startsWith("video/")));

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const asset = await api.post<MediaAsset>("/api/media", formData);
      setAssets((prev) => [asset, ...(prev ?? [])]);
      onSelect(asset.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Select {accept}</h2>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 border-b">
          <input
            ref={fileInput}
            type="file"
            accept={accept === "image" ? "image/*" : "video/*"}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border-2 border-dashed rounded-md px-4 py-3 text-sm text-slate-600 hover:border-blue-400 w-full justify-center disabled:opacity-50"
          >
            <Upload size={16} /> {uploading ? "Uploading..." : `Upload new ${accept}`}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-4 gap-3">
          {filtered?.length === 0 && (
            <div className="col-span-4 text-center text-sm text-slate-400 py-10">No {accept}s uploaded yet</div>
          )}
          {filtered?.map((asset) => (
            <button
              key={asset.id}
              onClick={() => onSelect(asset.url)}
              className="border rounded-md overflow-hidden hover:border-blue-400 aspect-square bg-slate-50"
            >
              {accept === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={asset.url} className="w-full h-full object-cover" muted />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
