"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Palette,
  Menu as MenuIcon,
  Users,
  LogOut,
  Inbox,
  PanelTop,
  Newspaper,
  CornerUpRight,
  ScrollText,
  DatabaseBackup,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { UserRole } from "@pgcms/shared";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Pages", icon: LayoutDashboard },
  { href: "/admin/collections", label: "Collections", icon: Newspaper },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/forms", label: "Form Submissions", icon: Inbox },
  { href: "/admin/settings/global-sections", label: "Global Sections", icon: PanelTop },
  { href: "/admin/settings/theme", label: "Theme", icon: Palette, roles: ["ADMIN"] },
  { href: "/admin/settings/navigation", label: "Navigation", icon: MenuIcon, roles: ["ADMIN"] },
  { href: "/admin/settings/redirects", label: "Redirects", icon: CornerUpRight, roles: ["ADMIN"] },
  { href: "/admin/settings/backup", label: "Backup", icon: DatabaseBackup, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText, roles: ["ADMIN"] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  async function logout() {
    await api.post("/api/auth/logout");
    router.replace("/admin/login");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  }
  if (!user) return null;

  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 shrink-0 bg-white border-r flex flex-col">
        <div className="px-5 py-5 border-b">
          <span className="font-semibold text-lg">pg-cms</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t space-y-2">
          <div className="px-3 text-xs text-slate-500 truncate">
            {user.email} · {user.role}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
