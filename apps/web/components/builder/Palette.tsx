"use client";

import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import { COMPONENT_CATEGORIES, COMPONENT_REGISTRY, type PageNode } from "@pgcms/shared";
import { api } from "@/lib/api";
import { IconRenderer } from "./IconRenderer";

export type SavedBlock = { id: string; name: string; content: PageNode };

/** Fired (on window) whenever a block is saved or deleted, so every mounted Palette
 * refreshes its Saved Blocks list without prop-drilling through the builder. */
export const BLOCKS_CHANGED_EVENT = "pgcms:blocks-changed";

function PaletteItem({ type, label, icon }: { type: string; label: string; icon: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { type: "palette", componentType: type },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-sm text-left hover:border-blue-400 hover:bg-blue-50 cursor-grab active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <IconRenderer name={icon} size={16} className="text-slate-500" />
      {label}
    </button>
  );
}

function BlockItem({ block, onDelete }: { block: SavedBlock; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block:${block.id}`,
    data: { type: "block", blockId: block.id },
  });

  return (
    <div
      ref={setNodeRef}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-sm hover:border-blue-400 hover:bg-blue-50"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <button {...listeners} {...attributes} className="flex items-center gap-2 flex-1 text-left cursor-grab active:cursor-grabbing min-w-0">
        <IconRenderer name="Bookmark" size={16} className="text-amber-500 shrink-0" />
        <span className="truncate">{block.name}</span>
      </button>
      <button
        onClick={() => onDelete(block.id)}
        title="Delete saved block"
        className="text-slate-300 hover:text-red-600 shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function Palette() {
  const [blocks, setBlocks] = useState<SavedBlock[]>([]);

  useEffect(() => {
    const load = () => api.get<SavedBlock[]>("/api/blocks").then(setBlocks).catch(() => setBlocks([]));
    load();
    window.addEventListener(BLOCKS_CHANGED_EVENT, load);
    return () => window.removeEventListener(BLOCKS_CHANGED_EVENT, load);
  }, []);

  async function deleteBlock(id: string) {
    await api.delete(`/api/blocks/${id}`);
    window.dispatchEvent(new Event(BLOCKS_CHANGED_EVENT));
  }

  return (
    <div className="w-64 shrink-0 border-r bg-slate-50 overflow-y-auto p-3 space-y-5">
      {blocks.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Saved Blocks</div>
          <div className="space-y-2">
            {blocks.map((block) => (
              <BlockItem key={block.id} block={block} onDelete={deleteBlock} />
            ))}
          </div>
        </div>
      )}
      {COMPONENT_CATEGORIES.map((category) => {
        const items = COMPONENT_REGISTRY.filter((c) => c.category === category && !c.hidden);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{category}</div>
            <div className="space-y-2">
              {items.map((item) => (
                <PaletteItem key={item.type} type={item.type} label={item.label} icon={item.icon} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
