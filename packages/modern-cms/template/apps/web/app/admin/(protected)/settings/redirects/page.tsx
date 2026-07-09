"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

type Redirect = { id: string; fromPath: string; toPath: string; permanent: boolean; createdAt: string };

/** Old URL → new URL mappings. Consulted whenever a public path matches neither a page
 * nor a collection item, so restructured sites keep their inbound links working. */
export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [permanent, setPermanent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Redirect[]>("/api/redirects").then(setRedirects).catch(() => {});
  }, []);

  async function add() {
    setError(null);
    if (!fromPath.trim() || !toPath.trim()) {
      setError("Both paths are required.");
      return;
    }
    setSaving(true);
    try {
      const created = await api.post<Redirect>("/api/redirects", { fromPath, toPath, permanent });
      setRedirects((prev) => [created, ...prev]);
      setFromPath("");
      setToPath("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create redirect");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await api.delete(`/api/redirects/${id}`);
    setRedirects((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Redirects</h1>
      <p className="text-sm text-slate-500 mb-6">
        When a visitor hits a URL that no longer exists, they're sent to the new address instead of a 404. Use these
        after renaming slugs or restructuring the site.
      </p>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</div>}

      <div className="flex items-end gap-2 mb-8">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-600">From (old path)</label>
          <input
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
            placeholder="/old-page"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <ArrowRight size={16} className="mb-2.5 text-slate-400 shrink-0" />
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-600">To (new path or URL)</label>
          <input
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
            placeholder="/new-page"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 mb-2.5 shrink-0">
          <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
          Permanent (301)
        </label>
        <button
          onClick={add}
          disabled={saving}
          className="flex items-center gap-1.5 bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="space-y-2">
        {redirects.length === 0 && <div className="text-sm text-slate-400">No redirects yet.</div>}
        {redirects.map((r) => (
          <div key={r.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <code className="truncate">{r.fromPath}</code>
              <ArrowRight size={13} className="text-slate-400 shrink-0" />
              <code className="truncate">{r.toPath}</code>
              <span className="text-xs text-slate-400 shrink-0">{r.permanent ? "301" : "302"}</span>
            </div>
            <button onClick={() => remove(r.id)} className="text-slate-300 hover:text-red-600 shrink-0 ml-3">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
