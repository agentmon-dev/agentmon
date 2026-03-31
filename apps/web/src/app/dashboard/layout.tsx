import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

const NAV_ITEMS = [
	{ href: "/dashboard", label: "Overview" },
	{ href: "/dashboard/history", label: "History" },
	{ href: "/dashboard/projects", label: "Projects" },
	{ href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<aside className="w-[var(--sidebar-width)] border-r border-[hsl(var(--border))] flex flex-col">
				{/* Brand */}
				<div className="p-4 border-b border-[hsl(var(--border))]">
					<Link href="/dashboard" className="font-serif text-lg font-bold text-[hsl(var(--primary))]">
						agentmon
					</Link>
				</div>

				{/* Nav */}
				<nav className="flex-1 p-3 space-y-1">
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="block rounded-md px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] transition-colors"
						>
							{item.label}
						</Link>
					))}

					<div className="pt-4 mt-4 border-t border-[hsl(var(--border))]">
						<Link
							href="/org"
							className="block rounded-md px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] transition-colors"
						>
							Organizations
						</Link>
					</div>
				</nav>

				{/* Footer */}
				<div className="p-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
					<ThemeSwitcher />
					<span className="text-xs text-[hsl(var(--muted-foreground))]">v0.1.0</span>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-auto">{children}</main>
		</div>
	);
}
