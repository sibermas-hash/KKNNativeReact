// apps/web/src/components/ui/status-badge.tsx
import * as React from "react";
import { Badge } from "@/components/ui/badge";

// Maps domain statuses to the theme-aware badge tones.
const STATUS_TONE: Record<string, "neutral" | "warning" | "danger"> = {
  Aktif: "neutral",
  Selesai: "neutral",
  Disetujui: "neutral",
  Review: "warning",
  Menunggu: "warning",
  Ditolak: "danger",
  Nonaktif: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}
