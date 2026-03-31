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
				<aside className="w-52 border-r bg-sidebar flex flex-col">
					<div className="px-4 py-3 border-b">
						<Link href="/dashboard" className="text-sm font-semibold tracking-tight">
							agentmon
						</Link>
					</div>

					<nav className="flex-1 p-2 space-y-0.5">
						{NAV_ITEMS.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
							>
								{item.label}
							</Link>
						))}

						<Separator className="my-2" />

						<Link
							href="/org"
							className="flex items-center rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							Organizations
						</Link>
					</nav>

					<div className="px-3 py-2 border-t flex items-center justify-between">
						<ThemeSwitcher />
						<span className="text-[11px] text-muted-foreground">v0.1.0</span>
					</div>
				</aside>

				<main className="flex-1 overflow-auto">{children}</main>
			</div>
		</TooltipProvider>
	);
}
