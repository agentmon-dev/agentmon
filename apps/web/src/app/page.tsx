import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function CopyCommand() {
	return (
		<div className="flex items-center gap-3 rounded-lg bg-foreground px-5 py-3 font-mono text-sm text-background">
			<span className="text-muted-foreground">$</span>
			<span>npx agentmon init</span>
		</div>
	);
}

export default function LandingPage() {
	return (
		<main className="min-h-screen">
			{/* Nav */}
			<nav className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
				<span className="font-serif text-xl font-bold text-primary">agentmon</span>
				<div className="flex items-center gap-4 text-sm">
					<Link href="/dashboard" className="hover:text-primary transition-colors">
						Dashboard
					</Link>
					<a href="https://github.com/agentmon-dev/agentmon" className="hover:text-primary transition-colors">
						GitHub
					</a>
					<Button render={<Link href="/auth/login" />}>Sign in</Button>
				</div>
			</nav>

			{/* Hero */}
			<section className="flex flex-col items-center text-center px-8 pt-24 pb-16 max-w-3xl mx-auto">
				<h1 className="text-5xl font-bold leading-tight tracking-tight">
					See where your AI tokens go.
				</h1>
				<p className="mt-6 text-lg text-muted-foreground max-w-xl">
					Auto-collect token usage from Claude Code, Codex, Gemini CLI, and more.
					Background daemon + web dashboard. Install and forget.
				</p>
				<div className="mt-10">
					<CopyCommand />
				</div>
				<p className="mt-4 text-xs text-muted-foreground">
					Works on macOS, Linux, and Windows. No runtime required.
				</p>
			</section>

			{/* Value props */}
			<section className="max-w-4xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardContent className="pt-6">
						<h2 className="text-lg font-semibold">Background collection</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Daemon watches your JSONL files and syncs every 5 minutes. You do nothing.
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<h2 className="text-lg font-semibold">Web dashboard</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Time, project, and model breakdowns. Not just totals, but trends.
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<h2 className="text-lg font-semibold">Multi-agent</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Claude Code, Codex, Gemini CLI, Cursor. All in one place.
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<h2 className="text-lg font-semibold">Team dashboards</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Create organizations. See your team's AI usage in aggregate.
						</p>
					</CardContent>
				</Card>
			</section>

			{/* Footer */}
			<footer className="text-center py-8 text-xs text-muted-foreground">
				agentmon is open source.{" "}
				<a href="https://github.com/agentmon-dev/agentmon" className="underline hover:text-primary">
					Star on GitHub
				</a>
			</footer>
		</main>
	);
}
