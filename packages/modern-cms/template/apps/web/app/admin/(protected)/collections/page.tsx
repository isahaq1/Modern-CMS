"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Newspaper, PencilLine } from "lucide-react";
import type { Collection, PageStatus } from "@pgcms/shared";
import { api } from "@/lib/api";

type CollectionWithCount = Collection & { _count: { items: number } };
type ItemRow = { id: string; slug: string; title: string; status: PageStatus; publishedAt: string | null; updatedAt: string };

/** Master–detail: collections on the left, the selected collection's items on the
 * right. Item content itself is edited in the full builder (Edit → item builder). */
export default function CollectionsAdmin() {
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemRow[] | null>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemSlug, setNewItemSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selected = collections.find((c) => c.id === selectedId) ?? null;

  async function loadCollections() {
    const rows = await api.get<CollectionWithCount[]>("/api/collections");
    setCollections(rows);
    if (!selectedId && rows.length > 0) setSelectedId(rows[0].id);
  }

  useEffect(() => {
    loadCollections().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setItems(null);
    api.get<ItemRow[]>(`/api/collections/${selectedId}/items`).then(setItems).catch(console.error);
  }, [selectedId]);

  async function createCollection() {
    setError(null);
    try {
      const created = await api.post<Collection>("/api/collections", { name: newName, slug: newSlug });
      setNewName("");
      setNewSlug("");
      await loadCollections();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    }
  }

  async function deleteCollection(id: string) {
    if (!confirm("Delete this collection AND all its items? This cannot be undone.")) return;
    await api.delete(`/api/collections/${id}`);
    setSelectedId(null);
    await loadCollections();
  }

  async function createItem() {
    if (!selectedId) return;
    setError(null);
    try {
      await api.post(`/api/collections/${selectedId}/items`, { title: newItemTitle, slug: newItemSlug });
      setNewItemTitle("");
      setNewItemSlug("");
      const rows = await api.get<ItemRow[]>(`/api/collections/${selectedId}/items`);
      setItems(rows);
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await api.delete(`/api/collections/items/${id}`);
    if (selectedId) {
      const rows = await api.get<ItemRow[]>(`/api/collections/${selectedId}/items`);
      setItems(rows);
    }
    await loadCollections();
  }

  const slugify = (v: string) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold mb-1">Collections</h1>
      <p className="text-sm text-slate-500 mb-6">
        Dynamic content types — a Blog, News, Events. Items live at /{"{collection}"}/{"{item}"} and are listed
        anywhere via the &quot;Collection List&quot; block.
      </p>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</div>}

      <div className="grid grid-cols-[260px_1fr] gap-6">
        <div className="space-y-2">
          {collections.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer ${
                selectedId === c.id ? "border-blue-400 bg-blue-50" : "bg-white hover:bg-slate-50"
              }`}
              onClick={() => setSelectedId(c.id)}
            >
              <div className="flex items-center gap-2 text-sm min-w-0">
                <Newspaper size={15} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    /{c.slug} · {c._count.items} item{c._count.items === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCollection(c.id);
                }}
                className="text-slate-300 hover:text-red-600 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="border rounded-md p-3 space-y-2 bg-slate-50">
            <div className="text-xs font-medium text-slate-500">New collection</div>
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(slugify(e.target.value));
              }}
              placeholder="Name (e.g. Blog)"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
            />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(slugify(e.target.value))}
              placeholder="Slug (e.g. blog)"
              className="w-full border rounded-md px-2 py-1.5 text-sm font-mono"
            />
            <button
              onClick={createCollection}
              disabled={!newName || !newSlug}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white rounded-md py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={14} /> Create
            </button>
          </div>
        </div>

        <div>
          {!selected && <div className="text-sm text-slate-400">Create or select a collection.</div>}
          {selected && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <input
                  value={newItemTitle}
                  onChange={(e) => {
                    setNewItemTitle(e.target.value);
                    setNewItemSlug(slugify(e.target.value));
                  }}
                  placeholder={`New ${selected.name} item title`}
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                />
                <input
                  value={newItemSlug}
                  onChange={(e) => setNewItemSlug(slugify(e.target.value))}
                  placeholder="slug"
                  className="w-44 border rounded-md px-3 py-2 text-sm font-mono"
                />
                <button
                  onClick={createItem}
                  disabled={!newItemTitle || !newItemSlug}
                  className="flex items-center gap-1.5 bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {items === null && <div className="text-sm text-slate-400">Loading items…</div>}
              {items?.length === 0 && <div className="text-sm text-slate-400">No items yet — add the first one above.</div>}
              <div className="space-y-2">
                {items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border rounded-md px-4 py-3 bg-white">
                    <div className="text-sm min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-xs text-slate-400">
                        /{selected.slug}/{item.slug} ·{" "}
                        <span className={item.status === "PUBLISHED" ? "text-green-600" : "text-amber-600"}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/collections/item/${item.id}`}
                        className="flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1.5 hover:bg-slate-50"
                      >
                        <PencilLine size={13} /> Edit
                      </Link>
                      <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
