"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "pgcms-theme";

// Rendered only when the site theme has dark mode enabled (see [[...slug]]/page.tsx).
// Flips the `data-theme` attribute the layout's beforeInteractive script already sets
// from localStorage/system preference, and persists the explicit choice going forward.
export function DarkModeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    setThemeState((document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage disabled (private browsing) — the toggle still works for this page view.
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-6 right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full shadow-lg transition-transform hover:scale-110"
      style={{ backgroundColor: "var(--theme-primary)", color: "#ffffff" }}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
