import Link from "next/link";

type ContentLink = { label?: string; href: string };

/**
 * Shared rendering rule for Container/Column's "links" field: exactly one link makes
 * the whole block clickable (wrap `children` in it); two or more can't — a block can't
 * be two different links at once — so they render as a small link list appended below
 * instead. Zero links renders `children` unchanged.
 */
export function withContentLinks(links: ContentLink[] | undefined, children: React.ReactNode, wrapperClassName: string) {
  const list = (links ?? []).filter((l) => l.href);

  if (list.length === 1) {
    return (
      <Link href={list[0].href} className={wrapperClassName}>
        {children}
      </Link>
    );
  }

  if (list.length > 1) {
    return (
      <>
        {children}
        <div className="flex flex-wrap gap-4 mt-4">
          {list.map((link, i) => (
            <Link key={i} href={link.href} className="text-sm font-medium underline underline-offset-2 hover:opacity-70">
              {link.label || link.href}
            </Link>
          ))}
        </div>
      </>
    );
  }

  return children;
}
