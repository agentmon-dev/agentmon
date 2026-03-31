import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-2xl font-bold">{value}</p>
				{sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
			</CardContent>
		</Card>
	);
}

function EmptyState() {
	return (
		<Card className="py-16">
			<CardContent className="flex flex-col items-center text-center">
				<h2 className="text-xl font-semibold mb-2">No data yet</h2>
				<p className="text-muted-foreground mb-6 max-w-md">
					Your daemon is collecting data. First results will appear within 5 minutes after
					you start using an AI coding agent.
				</p>
				<code className="rounded-lg bg-muted px-4 py-2 font-mono text-sm">
					agentmon status
				</code>
			</CardContent>
		</Card>
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
				<Badge variant="secondary" className="text-xs">
					* Input tokens may be underreported
				</Badge>
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
						<MetricCard label="Today's cost" value={`$${metrics.todayCost.toFixed(2)}`} />
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
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Usage Trend</CardTitle>
						</CardHeader>
						<CardContent className="h-64 flex items-center justify-center text-muted-foreground">
							Recharts AreaChart - connect to /api/usage
						</CardContent>
					</Card>

					{/* Row 3: Donut charts */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">By Agent</CardTitle>
							</CardHeader>
							<CardContent className="h-40 flex items-center justify-center text-muted-foreground text-sm">
								Agent distribution
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">By Project</CardTitle>
							</CardHeader>
							<CardContent className="h-40 flex items-center justify-center text-muted-foreground text-sm">
								Project distribution
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">By Model</CardTitle>
							</CardHeader>
							<CardContent className="h-40 flex items-center justify-center text-muted-foreground text-sm">
								Model distribution
							</CardContent>
						</Card>
					</div>

					{/* Row 4: Bar chart */}
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Daily Trend</CardTitle>
						</CardHeader>
						<CardContent className="h-48 flex items-center justify-center text-muted-foreground">
							Recharts BarChart - last 7 days
						</CardContent>
					</Card>

					{/* Row 5: What if? */}
					<Card>
						<CardHeader>
							<CardTitle>What if?</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Model cost simulation - select a target model to see potential savings
							</p>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
