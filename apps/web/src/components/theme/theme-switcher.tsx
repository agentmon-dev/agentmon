"use client";

import { useTheme } from "next-themes";

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	return (
		<button
			type="button"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="rounded-md p-2 hover:bg-[hsl(var(--muted))] transition-colors"
			aria-label="Toggle theme"
		>
			{theme === "dark" ? "☀" : "☽"}
		</button>
	);
}
