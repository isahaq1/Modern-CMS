"use client";

import { useEffect, useState } from "react";
import { X, ImagePlus, History, RotateCcw } from "lucide-react";
import { SUPPORTED_LOCALES, type Page, type PageRevision } from "@pgcms/shared";
import { api } from "@/lib/api";
import { MediaPickerModal } from "./MediaPickerModal";

type Tab = "general" | "seo" | "publishing" | "history";

/** ISO UTC instant → the local wall-clock string a <input type="datetime-local">
 * expects. The reverse (input → ISO) is just new Date(value).toISOString(), since the
 * browser interprets a bare datetime-local value in the user's own timezone. Round-
 * tripping through UTC this way is what makes scheduling timezone-correct — the old
 * code sent the raw local string and let the SERVER's timezone reinterpret it. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PageSettingsModal({
  page,
  onClose,
  onSaved,
  onRestore,
}: {
  page: Page;
  onClose: () => void;
  onSaved: (page: Page) => void;
  onRestore: (content: Page["content"]) => void;
}) {
  const [tab, setTab] = useState<Tab>("general");
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? "");
  const [ogImage, setOgImage] = useState(page.ogImage ?? "");
  const [publishAt, setPublishAt] = useState(page.publishAt ? isoToLocalInput(page.publishAt) : "");
  const [locale, setLocale] = useState(page.locale ?? "en");
  const [translationOfId, setTranslationOfId] = useState(page.translationOfId ?? "");
  const [noIndex, setNoIndex] = useState(page.noIndex ?? false);
  const [previewToken, setPreviewToken] = useState(page.previewToken ?? "");
  const [allPages, setAllPages] = useState<Pick<Page, "id" | "title" | "slug" | "locale" | "translationOfId">[]>([]);
  const [ogPicker, setOgPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [revisions, setRevisions] = useState<Pick<PageRevision, "id" | "title" | "createdAt">[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    api.get<typeof allPages>("/api/pages").then(setAllPages).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPreviewToken(page.previewToken ?? "");
    setNoIndex(page.noIndex ?? false);
  }, [page.id, page.previewToken, page.noIndex]);

  useEffect(() => {
    if (tab === "history" && revisions === null) {
      api.get<typeof revisions>(`/api/pages/${page.id}/revisions`).then(setRevisions);
    }
  }, [tab, revisions, page.id]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const updated = await api.put<Page>(`/api/pages/${page.id}`, {
        title,
        slug,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        ogImage: ogImage || null,
        // Send an exact UTC instant — the browser resolves the datetime-local value in
        // the editor's timezone, so scheduling means the same moment everywhere.
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
        locale,
        translationOfId: translationOfId || null,
        noIndex,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function regeneratePreviewToken() {
    const updated = await api.post<Page>(`/api/pages/${page.id}/regenerate-preview-token`, {});
    setPreviewToken(updated.previewToken ?? "");
    onSaved(updated);
  }

  const [savingTemplate, setSavingTemplate] = useState(false);
  async function saveAsTemplate() {
    const name = window.prompt("Template name", page.title);
    if (!name) return;
    setSavingTemplate(true);
    try {
      await api.post("/api/templates", { name, content: page.content });
      window.alert(`Saved "${name}" — it'll show up under "Start from" the next time you create a page.`);
    } finally {
      setSavingTemplate(false);
    }
  }

  const previewUrl =
    typeof window !== "undefined" && previewToken
      ? `${window.location.origin}/preview/${previewToken}`
      : previewToken
        ? `/preview/${previewToken}`
        : "";

  async function handleRestore(revisionId: string) {
    if (!confirm("Restore this version? Your current content will be saved as a new revision first, so nothing is lost.")) return;
    setRestoring(revisionId);
    try {
      const updated = await api.post<Page>(`/api/pages/${page.id}/revisions/${revisionId}/restore`, {});
      onRestore(updated.content);
      onSaved(updated);
      onClose();
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Page Settings</h2>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="flex border-b px-2">
          {(["general", "seo", "publishing", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium capitalize ${
                tab === t ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          {tab === "general" && (
            <>
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </Field>
              <Field label="Slug" hint="Controls the page's URL. Leave empty for the home page. Localized pages can be path-prefixed, e.g. es/servicios.">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Language" hint="Declared on the page for search engines and screen readers; right-to-left languages flip the whole layout automatically.">
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  {SUPPORTED_LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} ({l.code}){l.rtl ? " · RTL" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Translation of"
                hint="Link this page to its original-language version — the Language Switcher component then lists the whole group on every member page."
              >
                <select
                  value={translationOfId}
                  onChange={(e) => setTranslationOfId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Not a translation (original page)</option>
                  {allPages
                    .filter((p) => p.id !== page.id && !p.translationOfId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (/{p.slug || ""} · {p.locale ?? "en"})
                      </option>
                    ))}
                </select>
              </Field>
            </>
          )}

          {tab === "seo" && (
            <>
              <Field label="SEO title" hint="Shown in search results and browser tabs. Falls back to the page title if empty.">
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </Field>
              <Field label="SEO description">
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Social share image (OG image)">
                {ogImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ogImage} alt="" className="w-full h-32 object-cover rounded-md border mb-2" />
                )}
                <button
                  onClick={() => setOgPicker(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-md py-2 text-xs text-slate-600 hover:border-blue-400"
                >
                  <ImagePlus size={14} /> {ogImage ? "Change" : "Select"} image
                </button>
              </Field>
              <Field label="Hide from search engines" hint="Adds noindex — page stays reachable by URL but won't appear in Google or the sitemap.">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={noIndex} onChange={(e) => setNoIndex(e.target.checked)} />
                  Prevent indexing (noindex)
                </label>
              </Field>
            </>
          )}

          {tab === "publishing" && (
            <>
              <Field
                label="Draft preview link"
                hint="Share this URL with reviewers — works even while the page is unpublished. Regenerate if the link leaks."
              >
                {previewUrl ? (
                  <div className="space-y-2">
                    <input readOnly value={previewUrl} className="w-full border rounded-md px-3 py-2 text-xs font-mono bg-slate-50" />
                    <div className="flex gap-2">
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Open preview
                      </a>
                      <button type="button" onClick={regeneratePreviewToken} className="text-xs text-slate-500 hover:text-slate-700">
                        Regenerate link
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Save the page to generate a preview link.</p>
                )}
              </Field>
              <Field
                label="Publish at"
                hint="Leave empty to publish immediately when you hit Publish. If set, the page stays hidden from visitors until this moment, even while marked Published."
              >
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </Field>
              {publishAt && (
                <button onClick={() => setPublishAt("")} className="text-xs text-slate-500 hover:text-slate-700">
                  Clear scheduled date
                </button>
              )}
            </>
          )}

          {tab === "history" && (
            <div className="space-y-2">
              {revisions === null && <div className="text-sm text-slate-400">Loading...</div>}
              {revisions?.length === 0 && (
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <History size={16} /> No earlier versions yet — they're created automatically each time you save.
                </div>
              )}
              {revisions?.map((rev) => (
                <div key={rev.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{rev.title}</div>
                    <div className="text-xs text-slate-400">{new Date(rev.createdAt).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => handleRestore(rev.id)}
                    disabled={restoring === rev.id}
                    className="flex items-center gap-1.5 text-xs border rounded-md px-2 py-1.5 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw size={13} /> {restoring === rev.id ? "Restoring..." : "Restore"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {tab !== "history" && (
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-t">
            <button
              onClick={saveAsTemplate}
              disabled={savingTemplate}
              className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              {savingTemplate ? "Saving..." : "Save as template"}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        )}
      </div>

      {ogPicker && (
        <MediaPickerModal
          accept="image"
          onSelect={(url) => {
            setOgImage(url);
            setOgPicker(false);
          }}
          onClose={() => setOgPicker(false)}
        />
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
