"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Code2 } from "lucide-react";
import { FONT_OPTIONS, getComponentDefinition, type Breakpoint, type NodeStyle, type PageNode } from "@pgcms/shared";
import { FieldRenderer } from "./FieldRenderer";
import { ColorPickerField } from "./ColorPickerField";
import { MediaPickerModal } from "./MediaPickerModal";
import { KeyValueListEditor } from "./KeyValueListEditor";
import { JsonEditor } from "./JsonEditor";

type Tab = "content" | "style" | "json";

const ANIMATION_TYPES: { label: string; value: NonNullable<NodeStyle["animationType"]> }[] = [
  { label: "None (off)", value: "none" },
  { label: "Fade In", value: "fadeIn" },
  { label: "Slide Up", value: "slideUp" },
  { label: "Slide Down", value: "slideDown" },
  { label: "Slide Left", value: "slideLeft" },
  { label: "Slide Right", value: "slideRight" },
  { label: "Zoom In", value: "zoomIn" },
  { label: "Rotate In", value: "rotateIn" },
  { label: "Pulse", value: "pulse" },
  { label: "Scroll Reveal", value: "scrollReveal" },
  { label: "Blur In", value: "blurIn" },
  { label: "Flip In", value: "flipIn" },
  { label: "Bounce In", value: "bounceIn" },
];

const HOVER_EFFECTS: { label: string; value: NonNullable<NodeStyle["hoverEffect"]>; hint: string }[] = [
  { label: "None", value: "none", hint: "" },
  { label: "Lift", value: "lift", hint: "Rises with a soft shadow on hover." },
  { label: "3D Tilt", value: "tilt", hint: "Tilts in 3D toward the pointer as it moves." },
  { label: "Glow", value: "glow", hint: "A soft glow in the theme's primary color on hover." },
  { label: "Scale", value: "scale", hint: "Gently grows on hover." },
];

const ANIMATION_TRIGGERS: { label: string; value: NonNullable<NodeStyle["animationTrigger"]>; hint: string }[] = [
  { label: "On Load", value: "onLoad", hint: "Plays once, right away, when the page loads." },
  { label: "On Scroll", value: "onScroll", hint: "Plays once, the first time this section scrolls into view." },
  { label: "On Hover", value: "onHover", hint: "Plays while the mouse is over it, reverses on mouse-leave." },
  { label: "On Focus", value: "onFocus", hint: "Plays while a button/link/input inside it has keyboard focus." },
  { label: "On Click", value: "onClick", hint: "Replays from the start every time it's clicked." },
];

const EASE_PRESETS = [
  { label: "Smooth (power2.out)", value: "power2.out" },
  { label: "Gentle (power1.out)", value: "power1.out" },
  { label: "Sharp start (power2.in)", value: "power2.in" },
  { label: "Smooth both ends (power2.inOut)", value: "power2.inOut" },
  { label: "Overshoot (back.out)", value: "back.out(1.7)" },
  { label: "Elastic", value: "elastic.out(1,0.5)" },
  { label: "Bounce", value: "bounce.out" },
  { label: "Linear", value: "linear" },
];
const CUSTOM_EASE = "__custom__";

export function Inspector({
  node,
  device = "desktop",
  ancestors,
  onSelect,
  onChangeProps,
  onChangeStyle,
  onChangeColumnCount,
  onChangeZoneCount,
  onChangeGridDimensions,
  onEnableHeaderZones,
}: {
  node: PageNode | null;
  /** The breakpoint currently being edited — style changes land in this device's
   * override layer (see the builder page's handleChangeStyle). */
  device?: Breakpoint;
  /** Chain from outermost ancestor down to `node` itself, for the breadcrumb. */
  ancestors: PageNode[];
  onSelect: (id: string) => void;
  onChangeProps: (props: Record<string, unknown>) => void;
  onChangeStyle: (style: NodeStyle) => void;
  onChangeColumnCount: (count: number) => void;
  onChangeZoneCount: (count: number) => void;
  onChangeGridDimensions: (rows: number, columns: number) => void;
  onEnableHeaderZones: () => void;
}) {
  const [tab, setTab] = useState<Tab>("content");
  const [bgImagePicker, setBgImagePicker] = useState(false);
  const [bgVideoPicker, setBgVideoPicker] = useState(false);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    setDevMode(localStorage.getItem("pgcms_dev_mode") === "1");
  }, []);

  function toggleDevMode() {
    const next = !devMode;
    setDevMode(next);
    localStorage.setItem("pgcms_dev_mode", next ? "1" : "0");
    if (!next && tab === "json") setTab("content");
  }

  if (!node) {
    return (
      <div className="w-80 shrink-0 border-l bg-white p-6 text-sm text-slate-400">
        Select a component on the canvas to edit its content and style.
      </div>
    );
  }

  const def = getComponentDefinition(node.type);

  function setProp(key: string, value: unknown) {
    onChangeProps({ ...node!.props, [key]: value });
  }

  function setStyle<K extends keyof NodeStyle>(key: K, value: NodeStyle[K]) {
    onChangeStyle({ ...node!.style, [key]: value });
  }

  return (
    <div className="w-80 shrink-0 border-l bg-white overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">{def?.label ?? node.type}</div>
          <button
            onClick={toggleDevMode}
            title={devMode ? "Turn off developer mode" : "Turn on developer mode (raw JSON editing)"}
            className={clsx(
              "p-1 rounded-md",
              devMode ? "text-blue-600 bg-blue-50" : "text-slate-300 hover:text-slate-500"
            )}
          >
            <Code2 size={14} />
          </button>
        </div>
        {ancestors.length > 1 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 flex-wrap">
            {ancestors.map((ancestor, i) => {
              const ancestorDef = getComponentDefinition(ancestor.type);
              const isLast = i === ancestors.length - 1;
              return (
                <span key={ancestor.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-300">/</span>}
                  <button
                    onClick={() => onSelect(ancestor.id)}
                    disabled={isLast}
                    className={isLast ? "text-slate-700 font-medium cursor-default" : "hover:text-blue-600 hover:underline"}
                    title={isLast ? undefined : `Select parent: ${ancestorDef?.label ?? ancestor.type}`}
                  >
                    {ancestorDef?.label ?? ancestor.type}
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex border-b">
        {(devMode ? (["content", "style", "json"] as Tab[]) : (["content", "style"] as Tab[])).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 py-2 text-sm font-medium capitalize",
              tab === t ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <div className="p-4 space-y-4">
          {node.type === "header" && node.children.length === 0 && (
            <div className="space-y-2 border rounded-md p-3 bg-amber-50 border-amber-200">
              <p className="text-xs text-slate-600">
                This header predates the flexible layout. Upgrade it to get custom drop zones you can fill with a
                Logo, Nav Links, Buttons, or anything else.
              </p>
              <button
                onClick={onEnableHeaderZones}
                className="w-full bg-slate-900 text-white rounded-md py-1.5 text-xs font-medium hover:bg-slate-800"
              >
                Enable custom zones
              </button>
            </div>
          )}
          {node.type === "container" && (
            <CountStepper
              label="Columns"
              value={Number(node.props.columns) || 1}
              min={1}
              max={4}
              onChange={onChangeColumnCount}
              hint="Each column is its own drop zone — add or reorder components inside it independently. Lowering the count won't delete a column that already has content; remove it from the canvas instead."
            />
          )}
          {node.type === "grid" && (
            <>
              <CountStepper
                label="Columns"
                value={Number(node.props.columns) || 2}
                min={1}
                max={12}
                onChange={(cols) => onChangeGridDimensions(Number(node.props.rows) || 1, cols)}
                hint="Each cell is its own drop zone. Lowering the count won't delete cells that already have content; remove them from the canvas instead."
              />
              <CountStepper
                label="Rows"
                value={Number(node.props.rows) || 1}
                min={1}
                max={12}
                onChange={(rows) => onChangeGridDimensions(rows, Number(node.props.columns) || 2)}
                hint="A cell spanning multiple columns/rows (set on the cell itself, in its Style tab) takes up more room, pushing later cells to wrap — same as any CSS grid."
              />
            </>
          )}
          {node.type === "header" && node.children.length > 0 && (
            <CountStepper
              label="Zones"
              value={Number(node.props.zoneCount) || node.children.length}
              min={1}
              max={6}
              onChange={onChangeZoneCount}
              hint="Each zone is its own drop zone — the first hugs the left, the last hugs the right, and any in between share and center the space. Use the eye icon on a zone's contents to hide them without deleting."
            />
          )}
          {def?.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={node.props[field.key]}
              onChange={(v) => setProp(field.key, v)}
            />
          ))}
          {(!def || def.fields.length === 0) && (
            <div className="text-sm text-slate-400">This component has no editable content.</div>
          )}
        </div>
      )}

      {tab === "style" && (
        <div className="p-4 space-y-3">
          {device !== "desktop" && (
            <div className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-3 py-2">
              Editing <strong>{device}</strong> styles — changes here only apply at {device === "tablet" ? "≤1023px" : "≤767px"},
              overriding the desktop values. Clearing a field reverts to the desktop value.
            </div>
          )}
          <StyleGroup title="Basics" defaultOpen>
          <ColorPickerField
            label="Background color"
            value={node.style.backgroundColor}
            onChange={(v) => setStyle("backgroundColor", v)}
          />
          <ColorPickerField
            label="Text color"
            value={node.style.textColor}
            onChange={(v) => setStyle("textColor", v)}
          />

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Font</label>
            <select
              value={node.style.fontFamily ?? ""}
              onChange={(e) => setStyle("fontFamily", e.target.value || undefined)}
              className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
            >
              <option value="">Theme default</option>
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Text align</label>
            <div className="grid grid-cols-3 gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => setStyle("textAlign", align)}
                  className={clsx(
                    "border rounded-md py-1.5 text-xs capitalize",
                    node.style.textAlign === align ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white"
                  )}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Padding Y" value={node.style.paddingY} onChange={(v) => setStyle("paddingY", v)} />
            <TextInput label="Padding X" value={node.style.paddingX} onChange={(v) => setStyle("paddingX", v)} />
            <TextInput
              label="Border radius"
              value={node.style.borderRadius}
              onChange={(v) => setStyle("borderRadius", v)}
            />
            <TextInput label="Font size" value={node.style.fontSize} onChange={(v) => setStyle("fontSize", v)} />
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
              Per-side spacing (overrides Y/X)
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <TextInput label="Padding top" value={node.style.paddingTop} onChange={(v) => setStyle("paddingTop", v)} />
              <TextInput label="Padding bottom" value={node.style.paddingBottom} onChange={(v) => setStyle("paddingBottom", v)} />
              <TextInput label="Padding left" value={node.style.paddingLeft} onChange={(v) => setStyle("paddingLeft", v)} />
              <TextInput label="Padding right" value={node.style.paddingRight} onChange={(v) => setStyle("paddingRight", v)} />
              <TextInput label="Margin top" value={node.style.marginTop} onChange={(v) => setStyle("marginTop", v)} />
              <TextInput label="Margin bottom" value={node.style.marginBottom} onChange={(v) => setStyle("marginBottom", v)} />
            </div>
          </details>

          {(node.type === "container" || node.type === "column" || node.type === "grid" || node.type === "gridCell") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Align items</label>
                <select
                  value={node.style.alignItems ?? ""}
                  onChange={(e) => setStyle("alignItems", (e.target.value || undefined) as NodeStyle["alignItems"])}
                  className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">Default</option>
                  <option value="start">Top</option>
                  <option value="center">Center</option>
                  <option value="end">Bottom</option>
                  <option value="stretch">Stretch</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Justify</label>
                <select
                  value={node.style.justifyContent ?? ""}
                  onChange={(e) => setStyle("justifyContent", (e.target.value || undefined) as NodeStyle["justifyContent"])}
                  className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">Default</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="between">Space between</option>
                </select>
              </div>
            </div>
          )}

          {node.type === "gridCell" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Grid placement</label>
              <p className="text-xs text-slate-400">How many of the parent Grid&apos;s tracks this cell occupies.</p>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="Column span"
                  value={node.style.gridColumnSpan}
                  fallback={1}
                  min={1}
                  onChange={(v) => setStyle("gridColumnSpan", v)}
                />
                <NumberInput
                  label="Row span"
                  value={node.style.gridRowSpan}
                  fallback={1}
                  min={1}
                  onChange={(v) => setStyle("gridRowSpan", v)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Size</label>
            <p className="text-xs text-slate-400">
              Any dimension, any unit — the canvas resize handles adjust these too, keeping your unit.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <SizeInput label="Width" value={node.style.width} onChange={(v) => setStyle("width", v)} />
              <SizeInput label="Height" value={node.style.height} onChange={(v) => setStyle("height", v)} />
              <SizeInput label="Min width" value={node.style.minWidth} onChange={(v) => setStyle("minWidth", v)} />
              <SizeInput label="Min height" value={node.style.minHeight} onChange={(v) => setStyle("minHeight", v)} />
              <SizeInput label="Max width" value={node.style.maxWidth} onChange={(v) => setStyle("maxWidth", v)} />
              <SizeInput label="Max height" value={node.style.maxHeight} onChange={(v) => setStyle("maxHeight", v)} />
            </div>
          </div>
          </StyleGroup>

          <StyleGroup title="Background">
            <p className="text-xs text-slate-400">
              Layers stack: color, then image, then video, then the tint overlay — with the section&apos;s own
              components rendering on top. Any section can combine all of them.
            </p>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Background image</label>
              {node.style.backgroundImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={node.style.backgroundImage} alt="" className="w-full h-24 object-cover rounded-md border" />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setBgImagePicker(true)}
                  className="flex-1 border-2 border-dashed rounded-md py-2 text-xs text-slate-600 hover:border-blue-400"
                >
                  {node.style.backgroundImage ? "Change" : "Select"} image
                </button>
                {node.style.backgroundImage && (
                  <button
                    onClick={() => setStyle("backgroundImage", undefined)}
                    className="px-3 border rounded-md text-xs text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              {bgImagePicker && (
                <MediaPickerModal
                  accept="image"
                  onSelect={(url) => {
                    setStyle("backgroundImage", url);
                    setBgImagePicker(false);
                  }}
                  onClose={() => setBgImagePicker(false)}
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Background video</label>
              {node.style.backgroundVideo && (
                <video src={node.style.backgroundVideo} className="w-full h-24 object-cover rounded-md border" muted />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setBgVideoPicker(true)}
                  className="flex-1 border-2 border-dashed rounded-md py-2 text-xs text-slate-600 hover:border-blue-400"
                >
                  {node.style.backgroundVideo ? "Change" : "Select"} video
                </button>
                {node.style.backgroundVideo && (
                  <button
                    onClick={() => setStyle("backgroundVideo", undefined)}
                    className="px-3 border rounded-md text-xs text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              {bgVideoPicker && (
                <MediaPickerModal
                  accept="video"
                  onSelect={(url) => {
                    setStyle("backgroundVideo", url);
                    setBgVideoPicker(false);
                  }}
                  onClose={() => setBgVideoPicker(false)}
                />
              )}
            </div>
            <ColorPickerField
              label="Overlay tint"
              value={node.style.backgroundOverlay}
              onChange={(v) => setStyle("backgroundOverlay", v || undefined)}
            />
          </StyleGroup>

          <StyleGroup title="Border">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Style</label>
                <select
                  value={node.style.borderStyle ?? "none"}
                  onChange={(e) =>
                    setStyle(
                      "borderStyle",
                      e.target.value === "none" ? undefined : (e.target.value as NodeStyle["borderStyle"])
                    )
                  }
                  className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                >
                  {(["none", "solid", "dashed", "dotted", "double"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <TextInput label="Width" value={node.style.borderWidth} onChange={(v) => setStyle("borderWidth", v)} />
            </div>
            <ColorPickerField
              label="Border color"
              value={node.style.borderColor}
              onChange={(v) => setStyle("borderColor", v)}
            />
          </StyleGroup>

          <StyleGroup title="Shadow & Opacity">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Shadow</label>
              <div className="grid grid-cols-5 gap-1">
                {(["none", "sm", "md", "lg", "xl"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle("boxShadow", s === "none" ? undefined : s)}
                    className={clsx(
                      "border rounded-md py-1.5 text-xs uppercase",
                      (node.style.boxShadow ?? "none") === s ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">
                Opacity{node.style.opacity !== undefined ? ` (${Math.round(node.style.opacity * 100)}%)` : ""}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={node.style.opacity ?? 1}
                onChange={(e) => setStyle("opacity", Number(e.target.value) === 1 ? undefined : Number(e.target.value))}
                className="w-full"
              />
            </div>
          </StyleGroup>

          <StyleGroup title="Animation">
            <p className="text-xs text-slate-400">
              Plays on the live site (GSAP) — the builder canvas always shows the settled final state.
            </p>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Effect</label>
              <select
                value={node.style.animationType ?? "none"}
                onChange={(e) =>
                  setStyle(
                    "animationType",
                    e.target.value === "none" ? undefined : (e.target.value as NodeStyle["animationType"])
                  )
                }
                className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
              >
                {ANIMATION_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            {node.style.animationType && node.style.animationType !== "none" && (() => {
              const activeTrigger = node.style.animationTrigger ?? "onScroll";
              const triggerInfo = ANIMATION_TRIGGERS.find((t) => t.value === activeTrigger);
              const isLoopable = activeTrigger === "onLoad" || activeTrigger === "onScroll";
              const isCustomEase =
                !!node.style.animationEasing && !EASE_PRESETS.some((p) => p.value === node.style.animationEasing);
              return (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Trigger</label>
                    <select
                      value={activeTrigger}
                      onChange={(e) => setStyle("animationTrigger", e.target.value as NodeStyle["animationTrigger"])}
                      className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                    >
                      {ANIMATION_TRIGGERS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {triggerInfo && <p className="text-xs text-slate-400">{triggerInfo.hint}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Duration (s)"
                      value={node.style.animationDuration}
                      fallback={0.8}
                      step={0.1}
                      onChange={(v) => setStyle("animationDuration", v)}
                    />
                    <NumberInput
                      label="Delay (s)"
                      value={node.style.animationDelay}
                      fallback={0}
                      step={0.1}
                      onChange={(v) => setStyle("animationDelay", v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Easing</label>
                    <select
                      value={isCustomEase ? CUSTOM_EASE : node.style.animationEasing ?? "power2.out"}
                      onChange={(e) =>
                        setStyle(
                          "animationEasing",
                          e.target.value === CUSTOM_EASE ? node.style.animationEasing || "power2.out" : e.target.value
                        )
                      }
                      className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                    >
                      {EASE_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                      <option value={CUSTOM_EASE}>Custom…</option>
                    </select>
                    {isCustomEase && (
                      <input
                        value={node.style.animationEasing ?? ""}
                        placeholder="e.g. power3.inOut"
                        onChange={(e) => setStyle("animationEasing", e.target.value || undefined)}
                        className="w-full border rounded-md px-2 py-1.5 text-sm font-mono"
                      />
                    )}
                  </div>
                  {isLoopable && (
                    <>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={node.style.animationLoop ?? false}
                          onChange={(e) => setStyle("animationLoop", e.target.checked || undefined)}
                        />
                        Loop continuously (alternates back and forth instead of playing once)
                      </label>
                      <NumberInput
                        label="Stagger items (s) — 0 reveals the section as one block"
                        value={node.style.animationStagger}
                        fallback={0}
                        step={0.05}
                        onChange={(v) => setStyle("animationStagger", v)}
                      />
                    </>
                  )}
                </>
              );
            })()}
          </StyleGroup>

          <StyleGroup title="Modern Effects">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Hover effect</label>
              <select
                value={node.style.hoverEffect ?? "none"}
                onChange={(e) =>
                  setStyle(
                    "hoverEffect",
                    e.target.value === "none" ? undefined : (e.target.value as NodeStyle["hoverEffect"])
                  )
                }
                className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
              >
                {HOVER_EFFECTS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
              {node.style.hoverEffect && node.style.hoverEffect !== "none" && (
                <p className="text-xs text-slate-400">
                  {HOVER_EFFECTS.find((h) => h.value === node.style.hoverEffect)?.hint}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={node.style.glass ?? false}
                onChange={(e) => setStyle("glass", e.target.checked || undefined)}
              />
              Glass panel (frosted, translucent — best over an image or gradient)
            </label>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">
                Parallax drift{node.style.parallaxSpeed ? ` (${node.style.parallaxSpeed})` : " (off)"}
              </label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={node.style.parallaxSpeed ?? 0}
                onChange={(e) => setStyle("parallaxSpeed", Number(e.target.value) === 0 ? undefined : Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-400">
                Drifts the section against the scroll — negative floats up, positive lags behind.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Gradient headings</label>
              <ColorPickerField
                label="From"
                value={node.style.textGradientFrom}
                onChange={(v) => setStyle("textGradientFrom", v || undefined)}
              />
              <ColorPickerField
                label="To"
                value={node.style.textGradientTo}
                onChange={(v) => setStyle("textGradientTo", v || undefined)}
              />
              {(node.style.textGradientFrom || node.style.textGradientTo) && (
                <button
                  // One onChangeStyle call, not two setStyle calls — each setStyle
                  // spreads the same pre-update node.style, so the second would
                  // silently resurrect the field the first just cleared.
                  onClick={() => onChangeStyle({ ...node!.style, textGradientFrom: undefined, textGradientTo: undefined })}
                  className="text-xs text-slate-500 hover:text-red-600 underline"
                >
                  Clear gradient
                </button>
              )}
              <p className="text-xs text-slate-400">
                Set both colors to fill this section&apos;s headings with a gradient.
              </p>
            </div>
          </StyleGroup>

          <StyleGroup title="Advanced">
            <p className="text-xs text-slate-400">
              Escape hatch for anything not covered above — arbitrary CSS properties or HTML attributes.
            </p>
            <KeyValueListEditor
              label="Custom CSS properties"
              value={node.style.customCss}
              onChange={(v) => setStyle("customCss", v)}
              keyPlaceholder="letterSpacing"
              valuePlaceholder="0.05em"
            />
            <KeyValueListEditor
              label="Custom attributes"
              value={node.style.customAttributes}
              onChange={(v) => setStyle("customAttributes", v)}
              keyPlaceholder="data-analytics-id"
              valuePlaceholder="hero-cta"
            />
          </StyleGroup>
        </div>
      )}

      {tab === "json" && (
        <div className="p-4 space-y-4">
          <JsonEditor nodeId={node.id} label="Props (content)" value={node.props} onApply={onChangeProps} />
          <JsonEditor
            nodeId={node.id}
            label="Style"
            value={node.style as Record<string, unknown>}
            onApply={(v) => onChangeStyle(v as NodeStyle)}
          />
        </div>
      )}
    </div>
  );
}

/** Collapsible group for the Style tab — the option count has outgrown a flat list,
 * so each area folds away behind a header. Open state is per-mount (resets when you
 * select another node), which keeps the panel predictable. */
function StyleGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md"
      >
        {title}
        <ChevronDown size={14} className={clsx("transition-transform text-slate-400", open && "rotate-180")} />
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-3 border-t">{children}</div>}
    </div>
  );
}

function CountStepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  hint: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 border rounded-md text-sm hover:bg-slate-50"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-14 border rounded-md px-2 py-1.5 text-sm text-center"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 border rounded-md text-sm hover:bg-slate-50"
        >
          +
        </button>
      </div>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  );
}

const SIZE_UNITS = ["px", "%", "rem", "vw", "vh"] as const;

/** Number + unit pair for a CSS length. Values a plain input can't express (calc(),
 * auto, keywords) still round-trip: unparsable values show in a raw text field. */
function SizeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const match = value?.match(/^([\d.]+)(px|%|rem|vw|vh)$/);
  const isRaw = !!value && !match;
  const num = match ? match[1] : "";
  const unit = match ? match[2] : "px";

  if (isRaw) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full border rounded-md px-2 py-1.5 text-sm font-mono"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="flex">
        <input
          type="number"
          min={0}
          value={num}
          placeholder="auto"
          onChange={(e) => onChange(e.target.value === "" ? undefined : `${e.target.value}${unit}`)}
          className="w-full border rounded-l-md px-2 py-1.5 text-sm min-w-0"
        />
        <select
          value={unit}
          onChange={(e) => {
            if (num) onChange(`${num}${e.target.value}`);
          }}
          className="border border-l-0 rounded-r-md px-1 py-1.5 text-xs bg-slate-50 text-slate-600"
        >
          {SIZE_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        value={value ?? ""}
        placeholder="e.g. 48px"
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full border rounded-md px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  fallback,
  step = 1,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | undefined;
  fallback: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value ?? fallback}
        onChange={(e) => {
          const num = Number(e.target.value);
          onChange(Number.isNaN(num) || num === fallback ? undefined : num);
        }}
        className="w-full border rounded-md px-2 py-1.5 text-sm"
      />
    </div>
  );
}
