// apps/web/src/components/layout/sidebar.tsx
// Sidebar with real navigation: items with `href` render as Next <Link>.
"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type NavItem = {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

const ITEM_CLS =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left";

export function Sidebar({
  items,
  activeKey,
  onSelect,
  footer,
}: {
  items: NavItem[];
  activeKey: string;
  onSelect?: (key: string) => void;
  footer?: React.ReactNode;
}) {
  return (
    <aside
      className="flex h-full w-56 shrink-0 flex-col gap-1 p-4"
      style={{
        background: "var(--profile-surface)",
        borderRight: "1px solid var(--profile-border)",
      }}
    >
      <div className="mb-4 flex items-center gap-2 px-2">
        <span
          className="inline-block h-7 w-7 rounded-lg"
          style={{ background: "var(--profile-primary)" }}
        />
        <span
          className="font-heading text-lg font-bold"
          style={{ color: "var(--profile-text)" }}
        >
          SIBERMAS
        </span>
      </div>
      <span
        className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--profile-muted)" }}
      >
        Menu
      </span>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.key === activeKey;
          const st = active
            ? {
                background: "var(--profile-soft)",
                color: "var(--profile-soft-text)",
                fontWeight: 600,
              }
            : { color: "var(--profile-muted)" };
          const inner = (
            <>
              <span
                className="inline-block h-4 w-4 rounded"
                style={{ background: "var(--profile-border)" }}
              >
                {item.icon}
              </span>
              {item.label}
            </>
          );
          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(ITEM_CLS)}
                style={st}
              >
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect && onSelect(item.key)}
              className={cn(ITEM_CLS)}
              style={st}
            >
              {inner}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto">{footer}</div>
    </aside>
  );
}
