"use client";

import { useEffect, useState } from "react";
import { FONT_OPTIONS, type SiteTheme } from "@pgcms/shared";
import { api } from "@/lib/api";
import { ColorPickerField } from "@/components/builder/ColorPickerField";
import { MediaPickerModal } from "@/components/builder/MediaPickerModal";

export default function ThemeSettingsPage() {
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoPicker, setLogoPicker] = useState(false);
  const [faviconPicker, setFaviconPicker] = useState(false);

  useEffect(() => {
    api.get<SiteTheme>("/api/theme").then(setTheme);
  }, []);

  function set<K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) {
    setTheme((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!theme) return;
    setSaving(true);
    try {
      const updated = await api.put<SiteTheme>("/api/theme", theme);
      setTheme(updated);
    } finally {
      setSaving(false);
    }
  }

  if (!theme) return <div className="p-8 text-sm text-slate-400">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Theme Settings</h1>
      <p className="text-sm text-slate-500">
        Sets the site-wide defaults (brand colors, fonts, logo). Individual components can still override these per-page.
      </p>

      <div className="bg-white border rounded-lg p-6 space-y-5">
        <div className="space-y-1">
          <label className="text-sm font-medium">Site name</label>
          <input
            value={theme.siteName}
            onChange={(e) => set("siteName", e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ColorPickerField label="Primary color" value={theme.primaryColor} onChange={(v) => set("primaryColor", v)} />
          <ColorPickerField label="Secondary color" value={theme.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
          <ColorPickerField label="Background color" value={theme.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
          <ColorPickerField label="Text color" value={theme.textColor} onChange={(v) => set("textColor", v)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Heading font</label>
            <select
              value={theme.headingFont}
              onChange={(e) => set("headingFont", e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Body font</label>
            <select
              value={theme.bodyFont}
              onChange={(e) => set("bodyFont", e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            {theme.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={theme.logoUrl} alt="Logo" className="h-12 border rounded-md px-2 py-1 bg-slate-50" />
            )}
            <button
              onClick={() => setLogoPicker(true)}
              className="w-full border-2 border-dashed rounded-md py-2 text-xs text-slate-600 hover:border-blue-400"
            >
              {theme.logoUrl ? "Change logo" : "Select logo"}
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Favicon</label>
            {theme.faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={theme.faviconUrl} alt="Favicon" className="h-12 w-12 border rounded-md p-1 bg-slate-50" />
            )}
            <button
              onClick={() => setFaviconPicker(true)}
              className="w-full border-2 border-dashed rounded-md py-2 text-xs text-slate-600 hover:border-blue-400"
            >
              {theme.faviconUrl ? "Change favicon" : "Select favicon"}
            </button>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={theme.darkModeEnabled}
              onChange={(e) => set("darkModeEnabled", e.target.checked)}
            />
            Enable dark mode
          </label>
          <p className="text-xs text-slate-500">
            Adds a light/dark toggle to the public site. Leave the colors below blank to use sensible defaults.
          </p>
          {theme.darkModeEnabled && (
            <div className="grid grid-cols-3 gap-4">
              <ColorPickerField
                label="Dark primary color"
                value={theme.primaryColorDark ?? undefined}
                onChange={(v) => set("primaryColorDark", v)}
              />
              <ColorPickerField
                label="Dark background"
                value={theme.backgroundColorDark ?? undefined}
                onChange={(v) => set("backgroundColorDark", v)}
              />
              <ColorPickerField
                label="Dark text color"
                value={theme.textColorDark ?? undefined}
                onChange={(v) => set("textColorDark", v)}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 border-t pt-5">
          <label className="text-sm font-medium">Analytics</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Provider</label>
              <select
                value={theme.analyticsProvider}
                onChange={(e) => set("analyticsProvider", e.target.value as SiteTheme["analyticsProvider"])}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="none">None</option>
                <option value="ga4">Google Analytics (GA4)</option>
                <option value="plausible">Plausible</option>
                <option value="custom">Custom script</option>
              </select>
            </div>
            {theme.analyticsProvider !== "none" && theme.analyticsProvider !== "custom" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  {theme.analyticsProvider === "ga4" ? "Measurement ID (G-XXXXXXX)" : "Domain"}
                </label>
                <input
                  value={theme.analyticsId ?? ""}
                  onChange={(e) => set("analyticsId", e.target.value)}
                  placeholder={theme.analyticsProvider === "ga4" ? "G-XXXXXXXXXX" : "example.com"}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          {theme.analyticsProvider === "custom" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Custom script (inserted as-is on every public page)</label>
              <textarea
                value={theme.analyticsCustomScript ?? ""}
                onChange={(e) => set("analyticsCustomScript", e.target.value)}
                rows={4}
                className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                placeholder="<script>...</script>"
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Custom CSS (advanced)</label>
          <textarea
            value={theme.customCss ?? ""}
            onChange={(e) => set("customCss", e.target.value)}
            rows={5}
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder=".my-class { color: red; }"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save theme"}
        </button>
      </div>

      {logoPicker && (
        <MediaPickerModal
          accept="image"
          onSelect={(url) => {
            set("logoUrl", url);
            setLogoPicker(false);
          }}
          onClose={() => setLogoPicker(false)}
        />
      )}
      {faviconPicker && (
        <MediaPickerModal
          accept="image"
          onSelect={(url) => {
            set("faviconUrl", url);
            setFaviconPicker(false);
          }}
          onClose={() => setFaviconPicker(false)}
        />
      )}
    </div>
  );
}
