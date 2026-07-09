"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Save } from "lucide-react";
import {
  cloneWithNewIds,
  createNode,
  createEmptyPage,
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
  type NavItem,
  type NodeStyle,
  type PageNode,
  type SiteTheme,
} from "@pgcms/shared";
import { api } from "@/lib/api";
import { Palette } from "@/components/builder/Palette";
import { Canvas } from "@/components/builder/Canvas";
import { Inspector } from "@/components/builder/Inspector";
import { IconRenderer } from "@/components/builder/IconRenderer";

type Kind = "header" | "footer" | "goToTop";
type GlobalSectionRow = { kind: string; enabled: boolean; content: PageNode };

/** Edit-once site chrome: the same Palette/Canvas/Inspector as the page builder, but
 * saving into the GlobalSection rows that render above/below every page. */
export default function GlobalSectionsEditor() {
  const [kind, setKind] = useState<Kind>("header");
  const [trees, setTrees] = useState<Record<Kind, PageNode>>({
    header: createEmptyPage(),
    footer: createEmptyPage(),
    goToTop: createEmptyPage(),
  });
  const [enabled, setEnabled] = useState<Record<Kind, boolean>>({
    header: false,
    footer: false,
    goToTop: false,
  });
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const tree = trees[kind];

  useEffect(() => {
    (async () => {
      const [sections, themeData, nav] = await Promise.all([
        api.get<GlobalSectionRow[]>("/api/global-sections"),
        api.get<SiteTheme>("/api/theme"),
        api.get<NavItem[]>("/api/theme/nav"),
      ]);
      setTheme(themeData);
      setNavItems(nav);
      const next = {
        header: createEmptyPage(),
        footer: createEmptyPage(),
        goToTop: createEmptyPage(),
      } as Record<Kind, PageNode>;
      const nextEnabled = {
        header: false,
        footer: false,
        goToTop: false,
      } as Record<Kind, boolean>;
      for (const row of sections) {
        if (
          row.kind === "header" ||
          row.kind === "footer" ||
          row.kind === "goToTop"
        ) {
          next[row.kind as Kind] = row.content;
          nextEnabled[row.kind as Kind] = row.enabled;
        }
      }
      setTrees(next);
      setEnabled(nextEnabled);
      setLoaded(true);
    })().catch(console.error);
  }, []);

  function updateTree(updater: (prev: PageNode) => PageNode) {
    setTrees((prev) => ({ ...prev, [kind]: updater(prev[kind]) }));
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith("palette:"))
      setActiveDragType(id.slice("palette:".length));
    else setActiveDragType(findNode(tree, id)?.type ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragType(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const overData = over.data.current as
      | { type?: string; parentId?: string }
      | undefined;

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

    const targetDef = getComponentDefinition(
      findNode(tree, targetParentId)?.type ?? "",
    );
    if (targetParentId !== tree.id && !targetDef?.allowsChildren) return;

    if (activeId.startsWith("palette:")) {
      const newNode = createNode(activeId.slice("palette:".length));
      updateTree((prev) =>
        insertNode(prev, targetParentId, newNode, targetIndex),
      );
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
          updateTree((prev) =>
            insertNode(prev, targetParentId, copy, targetIndex),
          );
          setSelectedId(copy.id);
        })
        .catch(console.error);
      return;
    }

    const activeNode = findNode(tree, activeId);
    if (
      !activeNode ||
      isNodeOrDescendant(activeNode, targetParentId) ||
      activeId === overId
    )
      return;
    updateTree((prev) => {
      const before = findParent(prev, activeId);
      let idx = targetIndex;
      if (
        before &&
        before.parent.id === targetParentId &&
        before.index < targetIndex
      )
        idx = targetIndex - 1;
      return moveNode(prev, activeId, targetParentId, idx);
    });
  }

  async function save() {
    setSaving(true);
    try {
      await Promise.all(
        (["header", "footer", "goToTop"] as Kind[]).map((k) =>
          api.put(`/api/global-sections/${k}`, { enabled: enabled[k], content: trees[k] })
        )
      );
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;
  const ancestors =
    selectedId && tree ? findAncestorChain(tree, selectedId) : [];

  if (!loaded || !theme) {
    return (
      <div className="p-8 text-sm text-slate-400">Loading global sections…</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b bg-white px-4 py-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-sm">Global Sections</div>
          <div className="flex items-center border rounded-md overflow-hidden">
            {(["header", "footer", "goToTop"] as Kind[]).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setKind(k);
                  setSelectedId(null);
                }}
                className={
                  kind === k ? "px-3 py-1.5 text-xs font-medium bg-blue-600 text-white" : "px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                }
              >
                {k === "header" ? "Header" : k === "footer" ? "Footer" : "Go to Top"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={enabled[kind]}
              onChange={(e) =>
                setEnabled((prev) => ({ ...prev, [kind]: e.target.checked }))
              }
            />
            Show on every page
          </label>
          <span className="text-xs text-slate-400">
            Pages that still contain their own header/footer sections will show
            both — remove the per-page copies once this is enabled.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-slate-400">
              saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={15} /> Save
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
              updateTree((prev) =>
                updateNode(prev, id, (n) => ({
                  ...n,
                  props: { ...n.props, hidden: !n.props.hidden },
                })),
              )
            }
            onChangeStyle={(id, style) =>
              updateTree((prev) =>
                updateNode(prev, id, (n) => ({ ...n, style })),
              )
            }
          />
          <Inspector
            node={selectedNode ?? null}
            ancestors={ancestors}
            onSelect={(id) => setSelectedId(id)}
            onChangeProps={(props) =>
              selectedId &&
              updateTree((prev) =>
                updateNode(prev, selectedId, (n) => ({ ...n, props })),
              )
            }
            onChangeStyle={(style: NodeStyle) =>
              selectedId &&
              updateTree((prev) =>
                updateNode(prev, selectedId, (n) => ({ ...n, style })),
              )
            }
            onChangeColumnCount={() => {}}
            onChangeGridDimensions={() => {}}
            onChangeZoneCount={() => {}}
            onEnableHeaderZones={() => {}}
          />
        </div>
        <DragOverlay>
          {activeDragType && (
            <div className="bg-slate-900 text-white text-xs rounded px-3 py-2 flex items-center gap-2 shadow-lg">
              <IconRenderer
                name={getComponentDefinition(activeDragType)?.icon ?? "Square"}
                size={14}
              />
              {getComponentDefinition(activeDragType)?.label ?? activeDragType}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
