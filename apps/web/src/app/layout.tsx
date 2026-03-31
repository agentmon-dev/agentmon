import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
	title: "agentmon - See where your AI tokens go",
	description:
		"Auto-collect AI coding agent token usage in the background. Web dashboard for Claude Code, Codex, Gemini CLI, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
