"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type ImportSummary = { created: Record<string, number>; skipped: Record<string, number> };

export default function BackupPage() {
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function exportSite() {
    const res = await fetch("/api/backup/export", { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pg-cms-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importSite(file: File) {
    setError(null);
    setSummary(null);
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text());
      const result = await api.post<ImportSummary>("/api/backup/import", parsed);
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Backup</h1>
      <p className="text-sm text-slate-500">
        Export a full snapshot (theme, navigation, pages, collections, global sections, redirects, saved blocks,
        templates) as one JSON file, or restore from a previous export. Restoring is additive-only — it never
        overwrites or deletes anything already on this site; entries whose slug or name already exists are skipped.
      </p>

      <div className="bg-white border rounded-lg p-6 space-y-3">
        <h2 className="font-medium text-sm">Export</h2>
        <button
          onClick={exportSite}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          <Download size={15} /> Export site as JSON
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-3">
        <h2 className="font-medium text-sm">Import</h2>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          onChange={(e) => e.target.files?.[0] && importSite(e.target.files[0])}
          className="hidden"
          id="backup-file"
        />
        <label
          htmlFor="backup-file"
          className={`flex items-center gap-2 border-2 border-dashed rounded-md px-4 py-3 text-sm cursor-pointer hover:border-blue-400 ${
            importing ? "opacity-50 pointer-events-none" : "text-slate-600"
          }`}
        >
          <Upload size={15} /> {importing ? "Importing..." : "Choose a backup JSON file to restore"}
        </label>
        {summary && (
          <div className="text-xs space-y-1 border rounded-md p-3 bg-slate-50">
            <div className="font-medium text-slate-700">Import complete</div>
            {Object.keys({ ...summary.created, ...summary.skipped }).map((key) => (
              <div key={key} className="flex justify-between text-slate-600">
                <span>{key}</span>
                <span>
                  {summary.created[key] ?? 0} created
                  {summary.skipped[key] ? `, ${summary.skipped[key]} skipped (already existed)` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
