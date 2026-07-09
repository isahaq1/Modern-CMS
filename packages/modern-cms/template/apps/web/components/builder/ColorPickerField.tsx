"use client";

import { useState } from "react";
import { HexAlphaColorPicker } from "react-colorful";

export function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1 relative">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-8 h-8 rounded border shrink-0"
          style={{ backgroundColor: value || "#ffffff" }}
        />
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="transparent"
          className="flex-1 border rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      {open && (
        <div className="absolute z-40 mt-1 bg-white border rounded-md shadow-lg p-2">
          <HexAlphaColorPicker color={value || "#ffffff"} onChange={onChange} />
          <button
            className="text-xs text-slate-500 mt-2 w-full text-center"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
