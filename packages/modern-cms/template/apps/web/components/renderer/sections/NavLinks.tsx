"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { buildNavTree } from "@pgcms/shared";
import { useSiteData } from "@/components/theme/SiteDataContext";
import type { SectionProps } from "./types";

type CustomLink = { label: string; href: string };

export function NavLinks({ node }: SectionProps) {
  const { navItems } = useSiteData();
  const useSiteNavigation = node.props.useSiteNavigation !== false;
  const customLinks = (node.props.links as CustomLink[]) ?? [];

  if (!useSiteNavigation) {
    if (customLinks.length === 0) return null;
    return (
      <nav className="flex items-center gap-6">
        {customLinks.map((link, i) => (
          <Link key={i} href={link.href} className="text-sm font-medium hover:opacity-70">
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }

  const items = buildNavTree(navItems);
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-6">
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
          <Link key={item.id} href={item.href} className="text-sm font-medium hover:opacity-70">
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}
