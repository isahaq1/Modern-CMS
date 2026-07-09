"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { buildNavTree } from "@pgcms/shared";
import { useSiteData } from "@/components/theme/SiteDataContext";
import { CmsImage } from "../CmsImage";
import type { SectionProps } from "./types";

export function Header({ node, children }: SectionProps) {
  const sticky = node.props.sticky !== false;
  const hasZones = node.children.length > 0;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  return (
    // Stickiness itself is applied by the Renderer to the section element — an inner
    // sticky div can't work (its containing block is the section, exactly its own
    // height). This component only adds the scrolled-state shadow.
    <div>
      <div
        className={`px-4 py-4 transition-all duration-200 ${sticky && scrolled ? "shadow-md" : ""}`}
      >
        {hasZones ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {children}
          </div>
        ) : (
          <LegacyHeader />
        )}
      </div>
    </div>
  );
}

/** Headers saved before left/center/right zones existed have no children — keep them
 * rendering exactly as before instead of going blank. New headers use the zone layout. */
function LegacyHeader() {
  const { theme, navItems } = useSiteData();
  const [open, setOpen] = useState(false);
  const items = buildNavTree(navItems);

  return (
    <div className="relative flex items-center justify-between">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold">
        {theme.logoUrl ? (
          <CmsImage src={theme.logoUrl} alt={theme.siteName} width={200} height={64} className="h-8 w-auto" style={{ height: "2rem", width: "auto" }} />
        ) : (
          <span>{theme.siteName}</span>
        )}
      </div>
      <nav className="hidden md:flex items-center gap-6">
        {items.map((item) =>
          item.children.length > 0 ? (
            <div key={item.id} className="relative group">
              <Link
                href={item.href}
                className="flex items-center gap-1 text-sm font-medium hover:opacity-70 py-2"
              >
                {item.label}
                <ChevronDown size={14} />
              </Link>
              <div
                className="absolute left-0 top-full min-w-[180px] rounded-md border bg-white text-slate-900 shadow-lg py-1.5 z-40
                           opacity-0 invisible translate-y-1 transition-all duration-150
                           group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                           group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0"
              >
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.href}
                    className="block px-4 py-2 text-sm hover:bg-slate-50 whitespace-nowrap"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className="text-sm font-medium hover:opacity-70"
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
      <button
        className="md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <nav className="md:hidden absolute left-0 right-0 top-full bg-inherit flex flex-col gap-1 px-4 pb-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col">
              <Link href={item.href} className="text-sm font-medium py-2">
                {item.label}
              </Link>
              {item.children.length > 0 && (
                <div className="flex flex-col pl-4 border-l ml-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className="text-sm py-1.5 opacity-80"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
