import DOMPurify from "isomorphic-dompurify";

/** Sanitize editor-authored rich text before it reaches dangerouslySetInnerHTML —
 * strips scripts, event handlers, javascript: URLs, and other XSS vectors while
 * keeping everything the rich text editor can legitimately produce (headings, lists,
 * links, inline color styles, images, quotes, tables). Runs on the server during SSR
 * and in the browser via isomorphic-dompurify.
 *
 * Deliberately NOT applied to the Embed block, whose whole purpose is raw third-party
 * markup — that block should stay restricted to trusted roles instead. */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
