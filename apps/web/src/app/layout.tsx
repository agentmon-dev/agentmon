import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "@/styles/globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
	title: "agentmon - See where your AI tokens go",
	description:
		"Auto-collect AI coding agent token usage in the background. Web dashboard for Claude Code, Codex, Gemini CLI, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
