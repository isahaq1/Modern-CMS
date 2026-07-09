"use client";

import { useEffect } from "react";
import Script from "next/script";
import type { SiteTheme } from "@pgcms/shared";

/** Browsers never execute <script> tags inserted via innerHTML — parses the admin's
 * pasted snippet and recreates each script node with document.createElement, which
 * DOES execute, so a pasted "<script src=...></script><script>...</script>" snippet
 * (the common shape third-party analytics vendors hand out) actually runs. */
function CustomScript({ html }: { html: string }) {
  useEffect(() => {
    const container = document.createElement("div");
    container.innerHTML = html;
    const nodes = Array.from(container.childNodes);
    const inserted: HTMLElement[] = [];
    for (const node of nodes) {
      if (node.nodeName === "SCRIPT") {
        const source = node as HTMLScriptElement;
        const script = document.createElement("script");
        for (const attr of Array.from(source.attributes)) script.setAttribute(attr.name, attr.value);
        script.text = source.text;
        document.body.appendChild(script);
        inserted.push(script);
      } else {
        document.body.appendChild(node.cloneNode(true) as HTMLElement);
      }
    }
    return () => inserted.forEach((el) => el.remove());
  }, [html]);

  return null;
}

/** Renders whichever analytics snippet the site owner picked in Theme Settings.
 * Lives alongside ThemeStyleTag/JsonLd (per-request, where theme data is already
 * loaded) rather than the static root layout. */
export function AnalyticsScripts({
  theme,
}: {
  theme: Pick<SiteTheme, "analyticsProvider" | "analyticsId" | "analyticsCustomScript">;
}) {
  if (theme.analyticsProvider === "ga4" && theme.analyticsId) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${theme.analyticsId}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${theme.analyticsId}');`}
        </Script>
      </>
    );
  }

  if (theme.analyticsProvider === "plausible" && theme.analyticsId) {
    return <Script defer data-domain={theme.analyticsId} src="https://plausible.io/js/script.js" strategy="afterInteractive" />;
  }

  if (theme.analyticsProvider === "custom" && theme.analyticsCustomScript) {
    // Trusted-admin escape hatch, same trust boundary as the existing customCss field —
    // whoever can edit Theme Settings can already inject arbitrary CSS/attributes.
    return <CustomScript html={theme.analyticsCustomScript} />;
  }

  return null;
}
