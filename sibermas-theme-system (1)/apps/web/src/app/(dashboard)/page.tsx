// apps/web/src/app/(dashboard)/page.tsx
// The dashboard renders a DISTINCT layout per active theme via ThemeDashboard.
"use client";
import * as React from "react";
import { ThemeDashboard } from "@/components/layouts/theme-dashboard";
import { sampleDashboard } from "@/lib/dashboard-data";

export default function DashboardPage() {
  return <ThemeDashboard data={sampleDashboard} />;
}
