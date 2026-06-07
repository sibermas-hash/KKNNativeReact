// apps/web/src/components/layouts/theme-dashboard.tsx
// Dispatcher: renders the layout that matches the active theme's identity.
// Each theme = its own structure, shapes, and ornaments (not just colors).
"use client";
import * as React from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { type ThemeSlug } from "@/lib/theme-config";
import { type DashboardData } from "@/lib/dashboard-data";
import { AkademikLayout } from "@/components/layouts/akademik-layout";
import { NusantaraLayout } from "@/components/layouts/nusantara-layout";
import { MinimalLayout } from "@/components/layouts/minimal-layout";
import { SustainabilityLayout } from "@/components/layouts/sustainability-layout";
import { ProfessionalLayout } from "@/components/layouts/professional-layout";

type LayoutComponent = (props: { data: DashboardData }) => React.JSX.Element;

const LAYOUTS: Record<ThemeSlug, LayoutComponent> = {
  akademik: AkademikLayout,
  nusantara: NusantaraLayout,
  minimal: MinimalLayout,
  sustainability: SustainabilityLayout,
  professional: ProfessionalLayout,
};

export function ThemeDashboard({ data }: { data: DashboardData }) {
  const { slug } = useTheme();
  const Layout = LAYOUTS[slug] ?? AkademikLayout;
  return <Layout data={data} />;
}
