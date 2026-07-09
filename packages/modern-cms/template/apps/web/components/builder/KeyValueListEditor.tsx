"use client";

import { Plus, Trash2 } from "lucide-react";

/** Generic key/value list editor backing both the custom-CSS and custom-attributes
 * escape hatches in the Inspector's Advanced panel — deliberately untyped strings so
 * it can hold any CSS property or HTML attribute without a matching dedicated field. */
export function KeyValueListEditor({
  label,
  value,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: {
  label: string;
  value: Record<string, string> | undefined;
  onChange: (v: Record<string, string> | undefined) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const entries = Object.entries(value ?? {});

  function commit(next: [string, string][]) {
    onChange(next.length === 0 ? undefined : Object.fromEntries(next));
  }

  function updateKey(i: number, key: string) {
    const next = entries.slice();
    next[i] = [key, next[i][1]];
    commit(next);
  }
  function updateValue(i: number, val: string) {
    const next = entries.slice();
    next[i] = [next[i][0], val];
    commit(next);
  }
  function remove(i: number) {
    commit(entries.filter((_, idx) => idx !== i));
  }
  function add() {
    commit([...entries, ["", ""]]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {entries.map(([key, val], i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              value={key}
              placeholder={keyPlaceholder ?? "property"}
              onChange={(e) => updateKey(i, e.target.value)}
              className="w-[38%] border rounded-md px-2 py-1.5 text-xs font-mono"
            />
            <input
              value={val}
              placeholder={valuePlaceholder ?? "value"}
              onChange={(e) => updateValue(i, e.target.value)}
              className="flex-1 border rounded-md px-2 py-1.5 text-xs font-mono"
            />
            <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-600 shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {entries.length === 0 && <div className="text-xs text-slate-400 italic">None</div>}
      </div>
    </div>
  );
}
