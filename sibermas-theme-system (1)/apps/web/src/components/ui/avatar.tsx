// apps/web/src/components/ui/avatar.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  size = 32,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: "var(--profile-soft)",
        color: "var(--profile-soft-text)",
      }}
    >
      {initials}
    </span>
  );
}
