"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { ArrowLeft, Save, Eye, Globe2, Settings, Undo2, Redo2, Monitor, Tablet, Smartphone } from "lucide-react";
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
  setContainerColumnCount,
  setGridDimensions,
  setGridTrackSize,
  setHeaderZoneCount,
  ensureHeaderZones,
  getComponentDefinition,
  resolveNodeStyle,
  type Breakpoint,
  type Page,
  type PageNode,
  type NodeStyle,
  type SiteTheme,
  type NavItem,
} from "@pgcms/shared";
import { api } from "@/lib/api";
import { Palette } from "@/components/builder/Palette";
import { Canvas } from "@/components/builder/Canvas";
import { Inspector } from "@/components/builder/Inspector";
import { BuilderDeviceContext } from "@/components/builder/BuilderDeviceContext";
import { IconRenderer } from "@/components/builder/IconRenderer";
import { PageSettingsModal } from "@/components/builder/PageSettingsModal";

export default function PageBuilder() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [page, setPage] = useState<Page | null>(null);
  const [tree, setTree] = useState<PageNode | null>(null);
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Breakpoint>("desktop");
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Undo/redo history — every content-mutating action goes through updateTree() so it
  // gets recorded here, instead of calling setTree() directly.
  const [past, setPast] = useState<PageNode[]>([]);
  const [future, setFuture] = useState<PageNode[]>([]);
  const HISTORY_LIMIT = 50;

  // Continuous gestures (typing in a field, dragging a resize handle or color picker)
  // fire onChange dozens of times for what a user experiences as ONE edit. Without
  // coalescing, Ctrl+Z would undo one keystroke or one pixel of drag at a time.
  // Passing the same `coalesceKey` for calls within COALESCE_WINDOW_MS merges them
  // into a single history entry; omit it for discrete actions (delete, insert, toggle)
  // that should always get their own undo step.
  const lastCoalesceRef = useRef<{ key: string; time: number } | null>(null);
  const COALESCE_WINDOW_MS = 800;

  function updateTree(updater: (prev: PageNode) => PageNode, coalesceKey?: string) {
    if (!tree) return;
    const next = updater(tree);
    if (next === tree) return;

    const now = Date.now();
    const last = lastCoalesceRef.current;
    const shouldCoalesce = !!coalesceKey && !!last && last.key === coalesceKey && now - last.time < COALESCE_WINDOW_MS;

    if (!shouldCoalesce) {
      setPast((p) => [...p, tree].slice(-HISTORY_LIMIT));
      setFuture([]);
    }
    lastCoalesceRef.current = coalesceKey ? { key: coalesceKey, time: now } : null;
    setTree(next);
  }

  function undo() {
    if (past.length === 0 || !tree) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [tree, ...f]);
    setTree(previous);
  }

  function redo() {
    if (future.length === 0 || !tree) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, tree]);
    setTree(next);
  }

  const [draftPrompt, setDraftPrompt] = useState<{ content: PageNode; savedAt: string } | null>(null);
  const lastPersistedRef = useRef<string | null>(null); // JSON of the last content saved to the server
  const draftKey = `pgcms:draft:${params.id}`;

  useEffect(() => {
    api.get<Page>(`/api/pages/${params.id}`).then((p) => {
      setPage(p);
      setTree(p.content);
      lastPersistedRef.current = JSON.stringify(p.content);

      // A local draft newer than what the server has means a previous session ended
      // (crash, closed tab) before it could save — offer to bring that work back.
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw) as { content: PageNode; savedAt: string };
          if (new Date(draft.savedAt) > new Date(p.updatedAt ?? 0) && JSON.stringify(draft.content) !== JSON.stringify(p.content)) {
            setDraftPrompt(draft);
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      } catch {
        // Corrupt/unparseable draft — ignore it rather than block loading the page.
        localStorage.removeItem(draftKey);
      }
    });
    api.get<SiteTheme>("/api/theme").then(setTheme);
    api.get<NavItem[]>("/api/theme/nav").then(setNavItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Local backup on every change — survives a crashed tab even if the network is down.
  useEffect(() => {
    if (!tree) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ content: tree, savedAt: new Date().toISOString() }));
    } catch {
      // Storage full/unavailable — autosave to the server below still covers us.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  // Silent autosave to the server every 20s, only when there's actually something new.
  useEffect(() => {
    const id = setInterval(() => {
      if (!page || !tree) return;
      const serialized = JSON.stringify(tree);
      if (serialized === lastPersistedRef.current) return;
      api.put<Page>(`/api/pages/${page.id}`, { content: tree }).then((updated) => {
        lastPersistedRef.current = serialized;
        setPage(updated);
        setSavedAt(new Date());
      });
    }, 20000);
    return () => clearInterval(id);
  }, [page, tree]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith("palette:")) {
      setActiveDragType(id.slice("palette:".length));
    } else {
      const node = tree && findNode(tree, id);
      setActiveDragType(node?.type ?? null);
    }
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
      const type = activeId.slice("palette:".length);
      const newNode = createNode(type);
      updateTree((prev) => insertNode(prev, targetParentId, newNode, targetIndex));
      setSelectedId(newNode.id);
      return;
    }

    if (activeId.startsWith("block:")) {
      // Saved Block drop: fetch the stored template and insert an independent copy
      // (fresh ids throughout, so repeated inserts never collide).
      const blockId = activeId.slice("block:".length);
      api.get<{ id: string; content: PageNode }[]>("/api/blocks")
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
    if (!activeNode) return;
    if (isNodeOrDescendant(activeNode, targetParentId)) return; // prevent dropping into itself/descendant
    if (activeId === overId) return;

    updateTree((prev) => {
      const parentInfoBefore = findParent(prev, activeId);
      let idx = targetIndex;
      if (parentInfoBefore && parentInfoBefore.parent.id === targetParentId && parentInfoBefore.index < targetIndex) {
        idx = targetIndex - 1;
      }
      return moveNode(prev, activeId, targetParentId, idx);
    });
  }

  const handleSelect = useCallback((id: string) => setSelectedId(id === "" ? null : id), []);

  function handleDelete(id: string) {
    updateTree((prev) => removeNode(prev, id));
    setSelectedId((sel) => (sel === id ? null : sel));
  }

  function handleDuplicate(id: string) {
    updateTree((prev) => duplicateNode(prev, id));
  }

  function handleChangeProps(id: string, props: Record<string, unknown>) {
    updateTree((prev) => updateNode(prev, id, (n) => ({ ...n, props })), `props:${id}`);
  }

  function handleChangeStyle(id: string, style: NodeStyle) {
    // On desktop the incoming object IS the node's base style. On tablet/mobile the
    // Inspector and resize handles construct it against the device-effective style, so
    // only the keys that actually differ from effective belong in the override layer —
    // and clearing an override key reveals the base value again.
    if (device === "desktop") {
      updateTree((prev) => updateNode(prev, id, (n) => ({ ...n, style })), `style:${id}`);
      return;
    }
    const layerKey = device === "tablet" ? "styleTablet" : "styleMobile";
    updateTree(
      (prev) =>
        updateNode(prev, id, (n) => {
          const effective = resolveNodeStyle(n, device);
          const layer: Record<string, unknown> = { ...(n[layerKey] ?? {}) };
          const keys = new Set([...Object.keys(style), ...Object.keys(effective)]);
          for (const key of keys) {
            const next = (style as Record<string, unknown>)[key];
            const current = (effective as Record<string, unknown>)[key];
            if (next === current) continue;
            if (next === undefined) delete layer[key];
            else layer[key] = next;
          }
          return { ...n, [layerKey]: layer };
        }),
      `style:${id}:${device}`
    );
  }

  function handleChangeColumnCount(id: string, count: number) {
    updateTree((prev) => updateNode(prev, id, (n) => setContainerColumnCount(n, count)));
  }

  function handleChangeGridDimensions(id: string, rows: number, columns: number) {
    updateTree((prev) => updateNode(prev, id, (n) => setGridDimensions(n, rows, columns)));
  }

  function handleResizeGridTrack(gridId: string, axis: "column" | "row", index: number, size: string) {
    updateTree(
      (prev) => updateNode(prev, gridId, (n) => setGridTrackSize(n, axis, index, size)),
      `gridTrack:${gridId}:${axis}:${index}`
    );
  }

  function handleChangeZoneCount(id: string, count: number) {
    updateTree((prev) => updateNode(prev, id, (n) => setHeaderZoneCount(n, count)));
  }

  function handleToggleHidden(id: string) {
    updateTree((prev) => updateNode(prev, id, (n) => ({ ...n, props: { ...n.props, hidden: !n.props.hidden } })));
  }

  function handleEnableHeaderZones(id: string) {
    updateTree((prev) => updateNode(prev, id, ensureHeaderZones));
  }

  // Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y to redo — skipped while focus is
  // in a text input/textarea/contenteditable so it doesn't fight the browser's own
  // native undo for text editing.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditableField =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isEditableField) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (!mod || (key !== "z" && key !== "y")) return;

      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (key === "z") {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [past, future, tree]);

  async function save(publish?: boolean) {
    if (!page || !tree) return;
    setSaving(true);
    try {
      const updated = await api.put<Page>(`/api/pages/${page.id}`, {
        content: tree,
        ...(publish !== undefined ? { status: publish ? "PUBLISHED" : "DRAFT" } : {}),
      });
      lastPersistedRef.current = JSON.stringify(tree);
      localStorage.removeItem(draftKey);
      setPage(updated);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  function acceptDraft() {
    if (!draftPrompt) return;
    updateTree(() => draftPrompt.content);
    setDraftPrompt(null);
  }

  function discardDraft() {
    localStorage.removeItem(draftKey);
    setDraftPrompt(null);
  }

  if (!page || !tree || !theme) {
    return <div className="p-8 text-sm text-slate-400">Loading builder...</div>;
  }

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;
  const ancestors = selectedId ? findAncestorChain(tree, selectedId) : [];

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between border-b bg-white px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin")} className="text-slate-500 hover:text-slate-800">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-sm font-semibold">{page.title}</div>
            <div className="text-xs text-slate-400">
              /{page.slug || ""} · {page.status}
              {page.status === "PUBLISHED" && page.publishAt && new Date(page.publishAt) > new Date() && (
                <span className="text-amber-600"> · scheduled for {new Date(page.publishAt).toLocaleString()}</span>
              )}
              {savedAt && ` · saved ${savedAt.toLocaleTimeString()}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden mr-1" title="Preview & edit per device — styles set on tablet/mobile override desktop at that size">
            {(
              [
                { bp: "desktop" as Breakpoint, Icon: Monitor, label: "Desktop" },
                { bp: "tablet" as Breakpoint, Icon: Tablet, label: "Tablet (≤1023px)" },
                { bp: "mobile" as Breakpoint, Icon: Smartphone, label: "Mobile (≤767px)" },
              ]
            ).map(({ bp, Icon, label }) => (
              <button
                key={bp}
                onClick={() => setDevice(bp)}
                title={label}
                className={
                  device === bp
                    ? "p-1.5 bg-blue-600 text-white"
                    : "p-1.5 text-slate-500 hover:bg-slate-100"
                }
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md disabled:opacity-30"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md disabled:opacity-30 mr-1"
          >
            <Redo2 size={16} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
          >
            <Settings size={15} /> Settings
          </button>
          {page.previewToken && (
            <a
              href={`/preview/${page.previewToken}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Eye size={15} /> Preview
            </a>
          )}
          {page.status === "PUBLISHED" && (
            <a
              href={`/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Globe2 size={15} /> Live
            </a>
          )}
          <button
            onClick={() => save()}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            <Save size={15} /> Save
          </button>
          <button
            onClick={() => save(page.status !== "PUBLISHED")}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Globe2 size={15} /> {page.status === "PUBLISHED" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {draftPrompt && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm shrink-0">
          <span className="text-amber-800">
            Found unsaved changes from {new Date(draftPrompt.savedAt).toLocaleString()} that never made it to the
            server — restore them?
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={acceptDraft} className="bg-amber-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-amber-700">
              Restore
            </button>
            <button onClick={discardDraft} className="text-amber-700 px-3 py-1 text-xs hover:underline">
              Discard
            </button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <BuilderDeviceContext.Provider value={device}>
        <div className="flex flex-1 overflow-hidden">
          <Palette />
          <div className={device === "desktop" ? "flex-1 min-w-0 flex flex-col" : "flex-1 min-w-0 flex flex-col items-center bg-slate-200 overflow-auto"}>
            <div
              className={
                device === "desktop"
                  ? "flex-1 min-h-0 flex flex-col w-full"
                  : "flex-1 min-h-0 flex flex-col w-full bg-white shadow-xl my-3 border rounded-md overflow-hidden"
              }
              style={device === "tablet" ? { maxWidth: 768 } : device === "mobile" ? { maxWidth: 390 } : undefined}
            >
              <Canvas
                tree={tree}
                theme={theme}
                navItems={navItems}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleHidden={handleToggleHidden}
                onChangeStyle={handleChangeStyle}
                onResizeGridTrack={handleResizeGridTrack}
              />
            </div>
          </div>
          <Inspector
            // The Inspector edits the device-effective style: pass a shimmed node whose
            // style is resolved for the active breakpoint; handleChangeStyle diffs the
            // result back into the right override layer.
            node={selectedNode ? { ...selectedNode, style: resolveNodeStyle(selectedNode, device) } : null}
            device={device}
            ancestors={ancestors}
            onSelect={handleSelect}
            onChangeProps={(props) => selectedId && handleChangeProps(selectedId, props)}
            onChangeStyle={(style) => selectedId && handleChangeStyle(selectedId, style)}
            onChangeColumnCount={(count) => selectedId && handleChangeColumnCount(selectedId, count)}
            onChangeZoneCount={(count) => selectedId && handleChangeZoneCount(selectedId, count)}
            onChangeGridDimensions={(rows, cols) => selectedId && handleChangeGridDimensions(selectedId, rows, cols)}
            onEnableHeaderZones={() => selectedId && handleEnableHeaderZones(selectedId)}
          />
        </div>
        </BuilderDeviceContext.Provider>
        <DragOverlay>
          {activeDragType && (
            <div className="bg-slate-900 text-white text-xs rounded px-3 py-2 flex items-center gap-2 shadow-lg">
              <IconRenderer name={getComponentDefinition(activeDragType)?.icon ?? "Square"} size={14} />
              {getComponentDefinition(activeDragType)?.label ?? activeDragType}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {settingsOpen && (
        <PageSettingsModal
          page={page}
          onClose={() => setSettingsOpen(false)}
          onSaved={setPage}
          onRestore={(content) => setTree(content)}
        />
      )}
    </div>
  );
}
