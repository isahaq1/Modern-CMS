import type { SiteTheme } from "@pgcms/shared";

export function themeToCssVars(theme: Partial<SiteTheme>): React.CSSProperties {
  return {
    ["--theme-primary" as any]: theme.primaryColor,
    ["--theme-secondary" as any]: theme.secondaryColor,
    ["--theme-bg" as any]: theme.backgroundColor,
    ["--theme-text" as any]: theme.textColor,
    ["--theme-heading-font" as any]: theme.headingFont ? `"${theme.headingFont}", sans-serif` : undefined,
    ["--theme-body-font" as any]: theme.bodyFont ? `"${theme.bodyFont}", sans-serif` : undefined,
  };
}

/** Dark-token overrides, applied under `:root[data-theme="dark"]` (see the
 * beforeInteractive script in layout.tsx that sets the attribute). Blank fields fall
 * back to sensible computed defaults rather than the light colors, so turning dark
 * mode on without picking custom dark colors still looks like a real dark theme. */
function darkThemeToCssVars(theme: Partial<SiteTheme>): React.CSSProperties {
  return {
    ["--theme-primary" as any]: theme.primaryColorDark || theme.primaryColor,
    ["--theme-bg" as any]: theme.backgroundColorDark || "#0f172a",
    ["--theme-text" as any]: theme.textColorDark || "#f1f5f9",
  };
}

export function ThemeStyleTag({ theme }: { theme: Partial<SiteTheme> }) {
  const vars = themeToCssVars(theme);
  const cssVarString = Object.entries(vars)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");

  const darkVars = darkThemeToCssVars(theme);
  const darkCssVarString = Object.entries(darkVars)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");

  const fontFamilies = [theme.headingFont, theme.bodyFont].filter(Boolean) as string[];
  const fontsHref = fontFamilies.length
    ? `https://fonts.googleapis.com/css2?${fontFamilies
        .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
        .join("&")}&display=swap`
    : null;

  return (
    <>
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}
      <style
        dangerouslySetInnerHTML={{
          __html: `:root { ${cssVarString} } ${
            theme.darkModeEnabled ? `:root[data-theme="dark"] { ${darkCssVarString} }` : ""
          } ${theme.customCss ?? ""}`,
        }}
      />
    </>
  );
}
