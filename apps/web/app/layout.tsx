import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "pg-cms",
  description: "Drag-and-drop website CMS",
};

// Runs before hydration so a dark-mode visitor never sees a light flash: the
// `data-theme` attribute set here is what ThemeStyleTag's `:root[data-theme="dark"]`
// block targets. Harmless when a site hasn't enabled dark mode — that CSS block simply
// doesn't exist, so setting the attribute has no visual effect.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("pgcms-theme");
    var theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is scoped to this element's own attributes only (it does
    // not suppress mismatches in children) — needed because the beforeInteractive script
    // below sets data-theme before React hydrates, which would otherwise be flagged as a
    // server/client mismatch even though it's intentional.
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="pgcms-theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
