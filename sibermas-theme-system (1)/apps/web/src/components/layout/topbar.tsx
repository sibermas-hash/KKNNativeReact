// apps/web/src/components/layout/topbar.tsx
"use client";
import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export function Topbar({
  title,
  breadcrumb,
  userName = "Akun Tholib",
  userRole = "Koordinator",
  userInitials = "AT",
}: {
  title: string;
  breadcrumb?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
}) {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <div className="min-w-0">
        <h1
          className="font-heading text-xl font-bold leading-tight"
          style={{ color: "var(--profile-text)" }}
        >
          {title}
        </h1>
        {breadcrumb ? (
          <p className="text-xs" style={{ color: "var(--profile-muted)" }}>
            {breadcrumb}
          </p>
        ) : null}
      </div>

      <div className="mx-auto hidden w-full max-w-md md:block">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "var(--profile-input)",
            border: "1px solid var(--profile-border)",
          }}
        >
          <span
            className="inline-block h-3.5 w-3.5 rounded-full border"
            style={{ borderColor: "var(--profile-muted)" }}
          />
          <input
            placeholder="Cari mahasiswa, desa, laporan…"
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: "var(--profile-text)" }}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ThemeSwitcher />
        <div className="flex items-center gap-2">
          <Avatar initials={userInitials} />
          <div className="hidden leading-tight sm:block">
            <div
              className="text-sm font-medium"
              style={{ color: "var(--profile-text)" }}
            >
              {userName}
            </div>
            <div className="text-xs" style={{ color: "var(--profile-muted)" }}>
              {userRole}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
