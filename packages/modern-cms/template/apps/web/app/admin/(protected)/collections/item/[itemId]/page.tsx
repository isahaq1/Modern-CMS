"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ArrowLeft, Save, Globe2, ImagePlus, Languages } from "lucide-react";
import {
  cloneWithNewIds,
  createNode,
  findNode,
  findParent,
  findAncestorChain,
  insertNode,
  isNodeOrDescendant,
  moveNode,
  removeNode,
  duplicateNode,
  updateNode,
  getComponentDefinition,
  SUPPORTED_LOCALES,
  type CollectionItem,
  type NavItem,
  type PageNode,
  type SiteTheme,
} from "@pgcms/shared";
import { api } from "@/lib/api";
import { Palette } from "@/components/builder/Palette";
import { Canvas } from "@/components/builder/Canvas";
import { Inspector } from "@/components/builder/Inspector";
import { IconRenderer } from "@/components/builder/IconRenderer";
import { MediaPickerModal } from "@/components/builder/MediaPickerModal";

type ItemWithCollection = CollectionItem & { collection: { name: string; slug: string } };

/** The same visual builder as pages, editing one collection item's content plus its
 * card metadata (excerpt, cover image) shown by Collection List blocks. */
export default function CollectionItemBuilder() {
  const params = useParams<{ itemId: string }>();
  const router = useRouter();

  const [item, setItem] = useState<ItemWithCollection | null>(null);
  const [tree, setTree] = useState<PageNode | null>(null);
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [locale, setLocale] = useState("en");
  const [translationOfId, setTranslationOfId] = useState("");
  const [siblingItems, setSiblingItems] = useState<
    Pick<CollectionItem, "id" | "title" | "slug" | "locale" | "translationOfId">[]
  >([]);
  const [seoOpen, setSeoOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [coverPicker, setCoverPicker] = useState(false);
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    api.get<ItemWithCollection>(`/api/collections/items/${params.itemId}`).then((it) => {
      setItem(it);
      setTree(it.content);
      setExcerpt(it.excerpt ?? "");
      setCoverImage(it.coverImage ?? "");
      setSeoTitle(it.seoTitle ?? "");
      setSeoDescription(it.seoDescription ?? "");
      setOgImage(it.ogImage ?? "");
      setNoIndex(it.noIndex ?? false);
      setLocale(it.locale ?? "en");
      setTranslationOfId(it.translationOfId ?? "");
      // "Translation of" candidates are scoped to this item's own collection — a
      // translation only makes sense among items sharing a collection.
      api
        .get<typeof siblingItems>(`/api/collections/${it.collectionId}/items`)
        .then(setSiblingItems)
        .catch(() => setSiblingItems([]));
    });
    api.get<SiteTheme>("/api/theme").then(setTheme);
    api.get<NavItem[]>("/api/theme/nav").then(setNavItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.itemId]);

  function updateTree(updater: (prev: PageNode) => PageNode) {
    setTree((prev) => (prev ? updater(prev) : prev));
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith("palette:")) setActiveDragType(id.slice("palette:".length));
    else setActiveDragType((tree && findNode(tree, id)?.type) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragType(null);
    const { active, over } = event;
    if (!over || !tree) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const overData = over.data.current as { type?: string; parentId?: string } | undefined;

    let targetParentId: string;
    let targetIndex: number;
    if (overData?.type === "container" && overData.parentId) {
      targetParentId = overData.parentId;
      targetIndex = findNode(tree, targetParentId)?.children.length ?? 0;
    } else {
      const parentInfo = findParent(tree, overId);
      if (!parentInfo) return;
      targetParentId = parentInfo.parent.id;
      targetIndex = parentInfo.index;
    }

    const targetDef = getComponentDefinition(findNode(tree, targetParentId)?.type ?? "");
    if (targetParentId !== tree.id && !targetDef?.allowsChildren) return;

    if (activeId.startsWith("palette:")) {
      const newNode = createNode(activeId.slice("palette:".length));
      updateTree((prev) => insertNode(prev, targetParentId, newNode, targetIndex));
      setSelectedId(newNode.id);
      return;
    }
    if (activeId.startsWith("block:")) {
      const blockId = activeId.slice("block:".length);
      api
        .get<{ id: string; content: PageNode }[]>("/api/blocks")
        .then((blocks) => {
          const block = blocks.find((b) => b.id === blockId);
          if (!block) return;
          const copy = cloneWithNewIds(block.content);
          updateTree((prev) => insertNode(prev, targetParentId, copy, targetIndex));
          setSelectedId(copy.id);
        })
        .catch(console.error);
      return;
    }

    const activeNode = findNode(tree, activeId);
    if (!activeNode || isNodeOrDescendant(activeNode, targetParentId) || activeId === overId) return;
    updateTree((prev) => {
      const before = findParent(prev, activeId);
      let idx = targetIndex;
      if (before && before.parent.id === targetParentId && before.index < targetIndex) idx = targetIndex - 1;
      return moveNode(prev, activeId, targetParentId, idx);
    });
  }

  async function save(publishToggle?: boolean) {
    if (!item || !tree) return;
    setSaving(true);
    try {
      const nextStatus = publishToggle ? (item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED") : undefined;
      const updated = await api.put<ItemWithCollection>(`/api/collections/items/${item.id}`, {
        content: tree,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        ogImage: ogImage || null,
        noIndex,
        locale,
        translationOfId: translationOfId || null,
        ...(nextStatus ? { status: nextStatus } : {}),
      });
      setItem((prev) => (prev ? { ...prev, ...updated, collection: prev.collection } : prev));
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  const selectedNode = selectedId && tree ? findNode(tree, selectedId) : null;
  const ancestors = selectedId && tree ? findAncestorChain(tree, selectedId) : [];

  if (!item || !tree || !theme) {
    return <div className="p-8 text-sm text-slate-400">Loading item…</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b bg-white px-4 py-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push("/admin/collections")} className="text-slate-500 hover:text-slate-800">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{item.title}</div>
            <div className="text-xs text-slate-400 truncate">
              /{item.collection.slug}/{item.slug} · {item.status}
              {savedAt && ` · saved ${savedAt.toLocaleTimeString()}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Excerpt (shown on listing cards)"
            className="w-72 border rounded-md px-2 py-1.5 text-xs"
          />
          <button
            onClick={() => setCoverPicker(true)}
            title="Cover image (shown on listing cards)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-md hover:bg-slate-50 ${
              coverImage ? "text-green-700 border-green-300" : "text-slate-600"
            }`}
          >
            <ImagePlus size={14} /> {coverImage ? "Cover ✓" : "Cover"}
          </button>
          <button
            onClick={() => setLocaleOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-md hover:bg-slate-50 text-slate-600"
          >
            <Languages size={14} /> {locale.toUpperCase()} {localeOpen ? "▲" : "▼"}
          </button>
          <button
            onClick={() => setSeoOpen((o) => !o)}
            className="px-2.5 py-1.5 text-xs border rounded-md hover:bg-slate-50 text-slate-600"
          >
            SEO {seoOpen ? "▲" : "▼"}
          </button>
          <button
            onClick={() => save()}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            <Save size={15} /> Save
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Globe2 size={15} /> {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {localeOpen && (
        <div className="border-b bg-slate-50 px-4 py-3 grid grid-cols-2 gap-3 text-sm shrink-0">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Language</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-xs bg-white"
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.code}){l.rtl ? " · RTL" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Translation of</label>
            <select
              value={translationOfId}
              onChange={(e) => setTranslationOfId(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-xs bg-white"
            >
              <option value="">Not a translation (original item)</option>
              {siblingItems
                .filter((s) => s.id !== item.id && !s.translationOfId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} (/{s.slug} · {s.locale ?? "en"})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {seoOpen && (
        <div className="border-b bg-slate-50 px-4 py-3 grid grid-cols-2 gap-3 text-sm shrink-0">
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="SEO title"
            className="border rounded-md px-2 py-1.5 text-xs"
          />
          <input
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="OG image URL (or use cover)"
            className="border rounded-md px-2 py-1.5 text-xs"
          />
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="SEO description"
            rows={2}
            className="col-span-2 border rounded-md px-2 py-1.5 text-xs"
          />
          <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={noIndex} onChange={(e) => setNoIndex(e.target.checked)} />
            Hide from search engines (noindex)
          </label>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <Palette />
          <Canvas
            tree={tree}
            theme={theme}
            navItems={navItems}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === "" ? null : id)}
            onDelete={(id) => {
              updateTree((prev) => removeNode(prev, id));
              setSelectedId((sel) => (sel === id ? null : sel));
            }}
            onDuplicate={(id) => updateTree((prev) => duplicateNode(prev, id))}
            onToggleHidden={(id) =>
              updateTree((prev) => updateNode(prev, id, (n) => ({ ...n, props: { ...n.props, hidden: !n.props.hidden } })))
            }
            onChangeStyle={(id, style) => updateTree((prev) => updateNode(prev, id, (n) => ({ ...n, style })))}
          />
          <Inspector
            node={selectedNode ?? null}
            ancestors={ancestors}
            onSelect={(id) => setSelectedId(id)}
            onChangeProps={(props) =>
              selectedId && updateTree((prev) => updateNode(prev, selectedId, (n) => ({ ...n, props })))
            }
            onChangeStyle={(style) =>
              selectedId && updateTree((prev) => updateNode(prev, selectedId, (n) => ({ ...n, style })))
            }
            onChangeColumnCount={() => {}}
            onChangeZoneCount={() => {}}
            onChangeGridDimensions={() => {}}
            onEnableHeaderZones={() => {}}
          />
        </div>
        <DragOverlay>
          {activeDragType && (
            <div className="bg-slate-900 text-white text-xs rounded px-3 py-2 flex items-center gap-2 shadow-lg">
              <IconRenderer name={getComponentDefinition(activeDragType)?.icon ?? "Square"} size={14} />
              {getComponentDefinition(activeDragType)?.label ?? activeDragType}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {coverPicker && (
        <MediaPickerModal
          accept="image"
          onSelect={(url) => {
            setCoverImage(url);
            setCoverPicker(false);
          }}
          onClose={() => setCoverPicker(false)}
        />
      )}
    </div>
  );
}
