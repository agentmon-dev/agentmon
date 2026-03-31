import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";

const NAV_ITEMS = [
	{ href: "/dashboard", label: "Overview" },
	{ href: "/dashboard/history", label: "History" },
	{ href: "/dashboard/projects", label: "Projects" },
	{ href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<div className="flex min-h-screen">
				{/* Sidebar */}
				<aside className="w-60 border-r border-sidebar-border bg-sidebar flex flex-col">
					<div className="p-4 border-b border-sidebar-border">
						<Link href="/dashboard" className="font-serif text-lg font-bold text-sidebar-primary">
							agentmon
						</Link>
					</div>

					<nav className="flex-1 p-3 space-y-1">
						{NAV_ITEMS.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
							>
								{item.label}
							</Link>
						))}

						<Separator className="my-3" />

						<Link
							href="/org"
							className="flex items-center rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
						>
							Organizations
						</Link>
					</nav>

					<div className="p-3 border-t border-sidebar-border flex items-center justify-between">
						<ThemeSwitcher />
						<span className="text-xs text-muted-foreground">v0.1.0</span>
					</div>
				</aside>

				<main className="flex-1 overflow-auto">{children}</main>
			</div>
		</TooltipProvider>
	);
}
