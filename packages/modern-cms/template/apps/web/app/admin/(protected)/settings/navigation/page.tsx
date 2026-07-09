"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, CornerDownRight } from "lucide-react";
import { buildNavTree, type NavItem } from "@pgcms/shared";
import { api } from "@/lib/api";

export default function NavigationSettingsPage() {
  const [items, setItems] = useState<NavItem[] | null>(null);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [parentId, setParentId] = useState<string>("");

  function refresh() {
    api.get<NavItem[]>("/api/theme/nav").then((data) => setItems([...data].sort((a, b) => a.order - b.order)));
  }

  useEffect(refresh, []);

  const tree = items ? buildNavTree(items) : [];
  const topLevelItems = items?.filter((i) => !i.parentId) ?? [];

  async function addItem() {
    if (!label || !href) return;
    const siblingCount = (items?.filter((i) => (i.parentId ?? "") === (parentId || "")) ?? []).length;
    await api.post("/api/theme/nav", {
      label,
      href,
      order: siblingCount * 10,
      parentId: parentId || null,
    });
    setLabel("");
    setHref("");
    setParentId("");
    refresh();
  }

  async function removeItem(id: string) {
    await api.delete(`/api/theme/nav/${id}`);
    refresh();
  }

  async function changeParent(item: NavItem, newParentId: string) {
    const siblingCount = (items?.filter((i) => (i.parentId ?? "") === newParentId) ?? []).length;
    await api.put(`/api/theme/nav/${item.id}`, { parentId: newParentId || null, order: siblingCount * 10 });
    refresh();
  }

  async function move(siblings: NavItem[], index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= siblings.length) return;
    const a = siblings[index];
    const b = siblings[target];
    await Promise.all([
      api.put(`/api/theme/nav/${a.id}`, { order: b.order }),
      api.put(`/api/theme/nav/${b.id}`, { order: a.order }),
    ]);
    refresh();
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Navigation</h1>
      <p className="text-sm text-slate-500">
        Links shown in the site header. Give an item a parent to make it a submenu — it opens on hover under its
        parent link.
      </p>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex gap-3">
          <input
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="/path or https://..."
            value={href}
            onChange={(e) => setHref(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">No parent (top-level menu item)</option>
            {topLevelItems.map((p) => (
              <option key={p.id} value={p.id}>
                Submenu under &quot;{p.label}&quot;
              </option>
            ))}
          </select>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {tree.length === 0 && <div className="p-6 text-sm text-slate-500">No navigation links yet.</div>}
        {tree.map((item, index) => (
          <div key={item.id}>
            <NavRow
              item={item}
              topLevelItems={topLevelItems}
              onMoveUp={() => move(topLevelItems, index, -1)}
              onMoveDown={() => move(topLevelItems, index, 1)}
              onRemove={() => removeItem(item.id)}
              onChangeParent={(newParentId) => changeParent(item, newParentId)}
            />
            {item.children.map((child, childIndex) => (
              <div key={child.id} className="pl-8 border-t">
                <NavRow
                  item={{ ...child, children: [] }}
                  topLevelItems={topLevelItems}
                  isChild
                  onMoveUp={() => move(item.children, childIndex, -1)}
                  onMoveDown={() => move(item.children, childIndex, 1)}
                  onRemove={() => removeItem(child.id)}
                  onChangeParent={(newParentId) => changeParent(child, newParentId)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavRow({
  item,
  topLevelItems,
  isChild,
  onMoveUp,
  onMoveDown,
  onRemove,
  onChangeParent,
}: {
  item: NavItem & { children: NavItem[] };
  topLevelItems: NavItem[];
  isChild?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onChangeParent: (parentId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {isChild && <CornerDownRight size={14} className="text-slate-300 shrink-0" />}
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{item.label}</div>
          <div className="text-xs text-slate-400 truncate">{item.href}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={item.parentId ?? ""}
          onChange={(e) => onChangeParent(e.target.value)}
          className="text-xs border rounded-md px-2 py-1.5 bg-white text-slate-600"
          title="Parent menu item"
        >
          <option value="">Top-level</option>
          {topLevelItems
            .filter((p) => p.id !== item.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                Under &quot;{p.label}&quot;
              </option>
            ))}
        </select>
        <button onClick={onMoveUp} className="text-slate-400 hover:text-slate-700">
          <ChevronUp size={16} />
        </button>
        <button onClick={onMoveDown} className="text-slate-400 hover:text-slate-700">
          <ChevronDown size={16} />
        </button>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
