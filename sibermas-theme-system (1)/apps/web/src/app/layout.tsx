// apps/web/src/app/layout.tsx
import type { Metadata } from "next"
import { cookies } from "next/headers"
import "./globals.css"
import {
	ThemeProvider,
	ThemeNoFlashScript,
} from "@/components/ui/theme-provider"
import { THEME_STORAGE_KEY } from "@/lib/theme-config"

export const metadata: Metadata = {
	title: "SIBERMAS",
	description: "Sistem Informasi KKN UIN Saizu",
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// Read the persisted theme cookie on the server to avoid a flash.
	// (Optional: write this cookie from the client when setTheme runs.)
	const cookieStore = await cookies()
	const initialSlug = cookieStore.get(THEME_STORAGE_KEY)?.value

	return (
		<html lang="id" suppressHydrationWarning>
			<head>
				{/* Sets CSS vars before paint -> no FOUC. */}
				<ThemeNoFlashScript />
			</head>
			<body className="min-h-screen bg-[var(--profile-page)] text-[var(--profile-text)] antialiased">
				<ThemeProvider initialSlug={initialSlug}>{children}</ThemeProvider>
			</body>
		</html>
	)
}
