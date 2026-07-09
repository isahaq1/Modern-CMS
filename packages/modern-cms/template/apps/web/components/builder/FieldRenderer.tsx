"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ImagePlus, Video as VideoIcon } from "lucide-react";
import type { FieldDescriptor } from "@pgcms/shared";
import { RichTextEditor } from "./RichTextEditor";
import { MediaPickerModal } from "./MediaPickerModal";
import { ColorPickerField } from "./ColorPickerField";

export function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldDescriptor;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  switch (field.type) {
    case "text":
      return (
        <LabeledField label={field.label}>
          <input
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded-md px-2 py-1.5 text-sm"
          />
        </LabeledField>
      );
    case "textarea":
      return (
        <LabeledField label={field.label}>
          <textarea
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full border rounded-md px-2 py-1.5 text-sm"
          />
        </LabeledField>
      );
    case "url":
      return (
        <LabeledField label={field.label}>
          <input
            value={(value as string) ?? ""}
            placeholder={field.placeholder ?? "https://"}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded-md px-2 py-1.5 text-sm"
          />
        </LabeledField>
      );
    case "datetime":
      return (
        <LabeledField label={field.label}>
          <input
            type="datetime-local"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded-md px-2 py-1.5 text-sm"
          />
        </LabeledField>
      );
    case "number":
      return (
        <LabeledField label={field.label}>
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={(value as number) ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full border rounded-md px-2 py-1.5 text-sm"
          />
        </LabeledField>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );
    case "select":
      return (
        <LabeledField label={field.label}>
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </LabeledField>
      );
    case "color":
      return <ColorPickerField label={field.label} value={value as string} onChange={onChange} />;
    case "richtext":
      return (
        <LabeledField label={field.label}>
          <RichTextEditor value={(value as string) ?? ""} onChange={onChange} />
        </LabeledField>
      );
    case "image":
      return (
        <LabeledField label={field.label}>
          <MediaField
            kind="image"
            value={value as string}
            onChange={onChange}
            open={pickerOpen}
            setOpen={setPickerOpen}
          />
        </LabeledField>
      );
    case "video":
      return (
        <LabeledField label={field.label}>
          <MediaField
            kind="video"
            value={value as string}
            onChange={onChange}
            open={pickerOpen}
            setOpen={setPickerOpen}
          />
        </LabeledField>
      );
    case "array":
      return (
        <ArrayField
          field={field}
          value={(value as Record<string, unknown>[]) ?? []}
          onChange={onChange as (v: Record<string, unknown>[]) => void}
        />
      );
    default:
      return null;
  }
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function MediaField({
  kind,
  value,
  onChange,
  open,
  setOpen,
}: {
  kind: "image" | "video";
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative border rounded-md overflow-hidden h-28 bg-slate-50">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <video src={value} className="w-full h-full object-cover" muted />
          )}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-md py-2 text-xs text-slate-600 hover:border-blue-400"
      >
        {kind === "image" ? <ImagePlus size={14} /> : <VideoIcon size={14} />}
        {value ? "Change" : "Select"} {kind}
      </button>
      {open && (
        <MediaPickerModal
          accept={kind}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function ArrayField({
  field,
  value,
  onChange,
}: {
  field: FieldDescriptor;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  const itemFields = field.itemFields ?? [];

  function updateItem(index: number, key: string, itemValue: unknown) {
    const next = value.map((item, i) => (i === index ? { ...item, [key]: itemValue } : item));
    onChange(next);
  }

  function addItem() {
    const blank: Record<string, unknown> = {};
    for (const f of itemFields) blank[f.key] = f.default ?? "";
    onChange([...value, blank]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">{field.label}</label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="border rounded-md p-2 space-y-2 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">#{index + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(index, -1)} className="text-slate-400 hover:text-slate-700">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => move(index, 1)} className="text-slate-400 hover:text-slate-700">
                  <ChevronDown size={14} />
                </button>
                <button type="button" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {itemFields.map((f) => (
              <FieldRenderer key={f.key} field={f} value={item[f.key]} onChange={(v) => updateItem(index, f.key, v)} />
            ))}
          </div>
        ))}
        {value.length === 0 && <div className="text-xs text-slate-400 italic">No items yet</div>}
      </div>
    </div>
  );
}
