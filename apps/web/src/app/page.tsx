import Link from "next/link";
import { Button } from "@/components/ui/button";

function CopyCommand() {
	return (
		<code className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2.5 font-mono text-sm">
			<span className="text-muted-foreground">$</span>
			<span>npx agentmon init</span>
		</code>
	);
}

function Feature({ title, desc }: { title: string; desc: string }) {
	return (
		<div className="space-y-1">
			<h3 className="text-sm font-medium">{title}</h3>
			<p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
		</div>
	);
}

export default function LandingPage() {
	return (
		<main className="min-h-screen">
			{/* Nav */}
			<nav className="flex items-center justify-between px-6 py-3 border-b max-w-5xl mx-auto">
				<span className="text-sm font-semibold tracking-tight">agentmon</span>
				<div className="flex items-center gap-3 text-sm">
					<Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
						Dashboard
					</Link>
					<a href="https://github.com/agentmon-dev/agentmon" className="text-muted-foreground hover:text-foreground transition-colors">
						GitHub
					</a>
					<Button size="sm" render={<Link href="/auth/login" />}>
						Sign in
					</Button>
				</div>
			</nav>

			{/* Hero */}
			<section className="flex flex-col items-center text-center px-6 pt-20 pb-12 max-w-2xl mx-auto">
				<div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground mb-6">
					Open source AI token monitor
				</div>
				<h1 className="text-3xl font-semibold tracking-tight leading-tight">
					See where your AI tokens go
				</h1>
				<p className="mt-3 text-muted-foreground max-w-md">
					Auto-collect usage from Claude Code, Codex, Gemini CLI, and more.
					Background daemon. Web dashboard. Install and forget.
				</p>
				<div className="mt-8">
					<CopyCommand />
				</div>
				<p className="mt-3 text-xs text-muted-foreground">
					macOS, Linux, Windows. No runtime required.
				</p>
			</section>

			{/* Features */}
			<section className="max-w-2xl mx-auto px-6 pb-20">
				<div className="grid grid-cols-2 gap-6 border-t pt-8">
					<Feature
						title="Background collection"
						desc="Watches JSONL files, syncs every 5 minutes. Zero effort."
					/>
					<Feature
						title="Web dashboard"
						desc="Time, project, and model breakdowns with cost trends."
					/>
					<Feature
						title="Multi-agent"
						desc="Claude Code, Codex, Gemini CLI, Cursor. One place."
					/>
					<Feature
						title="Team dashboards"
						desc="Organizations with aggregated member usage."
					/>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-6 text-center text-xs text-muted-foreground">
				<a href="https://github.com/agentmon-dev/agentmon" className="hover:text-foreground transition-colors">
					github.com/agentmon-dev/agentmon
				</a>
			</footer>
		</main>
	);
}
