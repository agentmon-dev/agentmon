import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getMetrics(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

	const [todayData, monthData] = await Promise.all([
		supabase
			.from("usage_records")
			.select("input_tokens, output_tokens, estimated_cost_usd")
			.eq("user_id", userId)
			.gte("recorded_at", today.toISOString()),
		supabase
			.from("usage_records")
			.select("estimated_cost_usd")
			.eq("user_id", userId)
			.gte("recorded_at", monthStart.toISOString()),
	]);

	const todayTokens = (todayData.data || []).reduce(
		(sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0),
		0,
	);
	const todayCost = (todayData.data || []).reduce(
		(sum, r) => sum + (Number(r.estimated_cost_usd) || 0),
		0,
	);
	const monthCost = (monthData.data || []).reduce(
		(sum, r) => sum + (Number(r.estimated_cost_usd) || 0),
		0,
	);

	return {
		todayTokens,
		todayCost: Math.round(todayCost * 100) / 100,
		monthCost: Math.round(monthCost * 100) / 100,
		todayRecords: todayData.data?.length || 0,
	};
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div className="rounded-lg border border-[hsl(var(--border))] p-4">
			<p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
			<p className="text-2xl font-bold mt-1">{value}</p>
			{sub && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{sub}</p>}
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-24 text-center">
			<h2 className="text-xl font-semibold mb-2">No data yet</h2>
			<p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-md">
				Your daemon is collecting data. First results will appear within 5 minutes after you
				start using an AI coding agent.
			</p>
			<div className="rounded-lg bg-[hsl(var(--muted))] px-4 py-2 font-mono text-sm">
				agentmon status
			</div>
		</div>
	);
}

export default async function DashboardPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/auth/login");

	const metrics = await getMetrics(supabase, user.id);
	const hasData = metrics.todayRecords > 0 || metrics.monthCost > 0;

	return (
		<div className="p-6 max-w-6xl">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-xs text-[hsl(var(--muted-foreground))]">
					* Input tokens may be underreported
				</p>
			</div>

			{!hasData ? (
				<EmptyState />
			) : (
				<>
					{/* Row 1: KPI Metrics */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<MetricCard
							label="Today's tokens"
							value={metrics.todayTokens.toLocaleString()}
							sub="input + output"
						/>
						<MetricCard
							label="Today's cost"
							value={`$${metrics.todayCost.toFixed(2)}`}
						/>
						<MetricCard
							label="Active sessions"
							value={String(metrics.todayRecords)}
							sub="5-min buckets"
						/>
						<MetricCard
							label="This month"
							value={`$${metrics.monthCost.toFixed(2)}`}
							sub="cumulative"
						/>
					</div>

					{/* Row 2: Area chart placeholder */}
					<div className="rounded-lg border border-[hsl(var(--border))] p-6 mb-8 h-64 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
						Usage trend chart (Recharts AreaChart)
					</div>

					{/* Row 3: Donut charts placeholder */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
						<div className="rounded-lg border border-[hsl(var(--border))] p-4 h-48 flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm">
							Agent distribution
						</div>
						<div className="rounded-lg border border-[hsl(var(--border))] p-4 h-48 flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm">
							Project distribution
						</div>
						<div className="rounded-lg border border-[hsl(var(--border))] p-4 h-48 flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm">
							Model distribution
						</div>
					</div>

					{/* Row 4: Bar chart placeholder */}
					<div className="rounded-lg border border-[hsl(var(--border))] p-6 mb-8 h-48 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
						Daily trend bar chart (Recharts BarChart)
					</div>

					{/* Row 5: What if? */}
					<div className="rounded-lg border border-[hsl(var(--border))] p-6">
						<h3 className="text-lg font-semibold mb-4">What if?</h3>
						<p className="text-sm text-[hsl(var(--muted-foreground))]">
							Model cost simulation - coming in next iteration
						</p>
					</div>
				</>
			)}
		</div>
	);
}
