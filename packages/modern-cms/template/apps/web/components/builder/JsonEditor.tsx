"use client";

import { useEffect, useState } from "react";

/** Raw JSON escape hatch for a node's props or style — for edits the guided Content/
 * Style tabs don't expose yet. Re-syncs its local draft whenever the node's id changes
 * (switching selection), but not on every prop change, so it doesn't fight the user's
 * in-progress typing on every keystroke. */
export function JsonEditor({
  nodeId,
  label,
  value,
  onApply,
}: {
  nodeId: string;
  label: string;
  value: Record<string, unknown>;
  onApply: (value: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
    setError(null);
    setDirty(false);
    // Only reset when a different node is selected, not on every value change —
    // otherwise the textarea would reset out from under the user's own typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  function apply() {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError("Must be a JSON object");
        return;
      }
      setError(null);
      setDirty(false);
      onApply(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {dirty && (
          <button type="button" onClick={apply} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Apply
          </button>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        rows={10}
        spellCheck={false}
        className="w-full border rounded-md px-2 py-1.5 text-xs font-mono bg-slate-50"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
