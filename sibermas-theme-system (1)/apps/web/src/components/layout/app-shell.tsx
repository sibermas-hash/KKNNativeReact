// apps/web/src/components/layout/app-shell.tsx
// Shared chrome for module pages. Sidebar navigates with real routes and
// highlights the active item from the current pathname.
"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "mahasiswa", label: "Mahasiswa", href: "/mahasiswa" },
  { key: "lokasi", label: "Lokasi KKN", href: "/lokasi" },
  { key: "jadwal", label: "Jadwal", href: "/jadwal" },
  { key: "laporan", label: "Laporan", href: "/laporan" },
  { key: "pengaturan", label: "Pengaturan", href: "/pengaturan" },
];

function activeKeyForPath(pathname: string, fallback: string): string {
  let best = fallback;
  let bestLen = -1;
  for (const item of NAV) {
    if (!item.href) continue;
    const match =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(item.href + "/");
    if (match && item.href.length > bestLen) {
      best = item.key;
      bestLen = item.href.length;
    }
  }
  return best;
}

export function AppShell({
  children,
  title,
  breadcrumb,
  activeKey = "dashboard",
}: {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
  activeKey?: string;
}) {
  const pathname = usePathname() || "/";
  const active = activeKeyForPath(pathname, activeKey);
  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{
        background: "var(--profile-page)",
        color: "var(--profile-text)",
      }}
    >
      <Sidebar
        items={NAV}
        activeKey={active}
        footer={
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--profile-soft)" }}
          >
            <div
              className="font-heading text-sm font-bold"
              style={{ color: "var(--profile-text)" }}
            >
              SIBERMAS Pro
            </div>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--profile-muted)" }}
            >
              Modul lanjutan & laporan otomatis.
            </p>
            <Button size="sm" className="mt-3 w-full">
              Upgrade
            </Button>
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} breadcrumb={breadcrumb} />
        <main className="flex-1 overflow-y-auto px-6 pb-8">{children}</main>
      </div>
    </div>
  );
}
