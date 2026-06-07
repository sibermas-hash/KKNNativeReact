// apps/web/src/components/ui/data-table.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right";
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey?: (row: T, index: number) => React.Key;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--profile-border)" }}>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "py-2 px-3 text-[11px] font-semibold uppercase tracking-wide",
                  c.align === "right" ? "text-right" : "text-left",
                  c.className,
                )}
                style={{ color: "var(--profile-muted)" }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={getRowKey ? getRowKey(row, i) : i}
              style={{ borderBottom: "1px solid var(--profile-border)" }}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "py-3 px-3 align-middle",
                    c.align === "right" ? "text-right" : "text-left",
                    c.className,
                  )}
                  style={{ color: "var(--profile-text)" }}
                >
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
