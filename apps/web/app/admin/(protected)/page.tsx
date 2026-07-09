"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, Pencil, Copy, Download, LayoutTemplate } from "lucide-react";
import type { Page, PageTemplate } from "@pgcms/shared";
import { api, ApiError } from "@/lib/api";

export default function PagesDashboard() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[] | null>(null);
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.get<Page[]>("/api/pages").then(setPages);
  }

  useEffect(refresh, []);
  useEffect(() => {
    api.get<PageTemplate[]>("/api/templates").then(setTemplates).catch(() => setTemplates([]));
  }, []);

  async function createPage() {
    setError(null);
    try {
      const page = await api.post<Page>("/api/pages", { title, slug, ...(templateId ? { templateId } : {}) });
      setCreating(false);
      setTitle("");
      setSlug("");
      setTemplateId(null);
      router.push(`/admin/pages/${page.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create page");
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    await api.delete(`/api/pages/${id}`);
    refresh();
  }

  async function duplicatePage(id: string) {
    const page = await api.post<Page>(`/api/pages/${id}/duplicate`, {});
    refresh();
    router.push(`/admin/pages/${page.id}`);
  }

  async function exportPage(id: string, slug: string) {
    const res = await fetch(`/api/pages/${id}/export`, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "home"}.page.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pages</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> New page
        </button>
      </div>

      {creating && (
        <div className="mb-6 bg-white border rounded-lg p-4 space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-3">
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <input
              placeholder="slug (e.g. about, leave empty for home)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Start from</label>
            <div className="flex gap-3 overflow-x-auto pb-1">
              <button
                onClick={() => setTemplateId(null)}
                className={`shrink-0 w-28 h-20 rounded-md border-2 flex flex-col items-center justify-center gap-1 text-xs font-medium ${
                  templateId === null ? "border-blue-500 bg-blue-50 text-blue-700" : "border-dashed text-slate-500 hover:border-slate-400"
                }`}
              >
                <LayoutTemplate size={18} />
                Blank page
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={`shrink-0 w-28 h-20 rounded-md border-2 flex flex-col items-center justify-center gap-1 text-xs font-medium overflow-hidden ${
                    templateId === t.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {t.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <LayoutTemplate size={18} />
                      <span className="px-1 text-center truncate w-full">{t.name}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createPage}
              disabled={!title}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Create
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg divide-y">
        {pages?.length === 0 && <div className="p-6 text-sm text-slate-500">No pages yet.</div>}
        {pages?.map((page) => (
          <div key={page.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium">{page.title}</div>
              <div className="text-xs text-slate-500">
                /{page.slug}{" "}
                <span
                  className={
                    page.status === "PUBLISHED" ? "text-green-600 font-medium" : "text-amber-600 font-medium"
                  }
                >
                  {page.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {page.status === "PUBLISHED" && (
                <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600">
                  <ExternalLink size={16} />
                </a>
              )}
              <button onClick={() => exportPage(page.id, page.slug)} title="Export as JSON" className="text-slate-400 hover:text-slate-600">
                <Download size={16} />
              </button>
              <button onClick={() => duplicatePage(page.id)} title="Duplicate" className="text-slate-400 hover:text-slate-600">
                <Copy size={16} />
              </button>
              <Link href={`/admin/pages/${page.id}`} className="text-slate-400 hover:text-slate-600">
                <Pencil size={16} />
              </Link>
              <button onClick={() => deletePage(page.id)} className="text-slate-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
