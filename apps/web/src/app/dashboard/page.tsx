import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsageAreaChart } from "@/components/charts/usage-area-chart";
import { DistributionDonut } from "@/components/charts/distribution-donut";
import { DailyBarChart } from "@/components/charts/daily-bar-chart";
import { WhatIfCard } from "@/components/charts/what-if-card";

interface UsageRecord {
	recorded_at: string;
	agent: string;
	project: string;
	model: string;
	input_tokens: number;
	output_tokens: number;
	cache_read_tokens: number;
	estimated_cost_usd: string;
}

async function getDashboardData(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
	const now = new Date();
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

	const [weekData, monthData] = await Promise.all([
		supabase
			.from("usage_records")
			.select("*")
			.eq("user_id", userId)
			.gte("recorded_at", weekAgo.toISOString())
			.order("recorded_at", { ascending: true }),
		supabase
			.from("usage_records")
			.select("estimated_cost_usd")
			.eq("user_id", userId)
			.gte("recorded_at", monthStart.toISOString()),
	]);

	const records: UsageRecord[] = weekData.data || [];
	const todayRecords = records.filter((r) => new Date(r.recorded_at) >= today);

	// KPI metrics
	const todayTokens = todayRecords.reduce((s, r) => s + (r.input_tokens || 0) + (r.output_tokens || 0), 0);
	const todayCost = todayRecords.reduce((s, r) => s + Number(r.estimated_cost_usd || 0), 0);
	const monthCost = (monthData.data || []).reduce((s, r) => s + Number(r.estimated_cost_usd || 0), 0);

	// Area chart: group by hour
	const hourBuckets = new Map<string, { input: number; output: number; cacheRead: number }>();
	for (const r of records) {
		const d = new Date(r.recorded_at);
		const key = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:00`;
		const bucket = hourBuckets.get(key) || { input: 0, output: 0, cacheRead: 0 };
		bucket.input += r.input_tokens || 0;
		bucket.output += r.output_tokens || 0;
		bucket.cacheRead += r.cache_read_tokens || 0;
		hourBuckets.set(key, bucket);
	}
	const areaData = [...hourBuckets.entries()].map(([time, v]) => ({ time, ...v }));

	// Donut: by agent
	const agentMap = new Map<string, number>();
	for (const r of records) {
		agentMap.set(r.agent, (agentMap.get(r.agent) || 0) + (r.input_tokens || 0) + (r.output_tokens || 0));
	}
	const agentData = [...agentMap.entries()].map(([name, value]) => ({ name, value }));

	// Donut: by project
	const projectMap = new Map<string, number>();
	for (const r of records) {
		projectMap.set(r.project, (projectMap.get(r.project) || 0) + (r.input_tokens || 0) + (r.output_tokens || 0));
	}
	const projectData = [...projectMap.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, value]) => ({ name, value }));

	// Donut: by model
	const modelMap = new Map<string, number>();
	for (const r of records) {
		modelMap.set(r.model, (modelMap.get(r.model) || 0) + (r.input_tokens || 0) + (r.output_tokens || 0));
	}
	const modelData = [...modelMap.entries()].map(([name, value]) => ({ name, value }));

	// Bar: daily cost
	const dayMap = new Map<string, number>();
	for (const r of records) {
		const d = new Date(r.recorded_at);
		const key = `${(d.getMonth() + 1)}/${d.getDate()}`;
		dayMap.set(key, (dayMap.get(key) || 0) + Number(r.estimated_cost_usd || 0));
	}
	const dailyData = [...dayMap.entries()].map(([day, cost]) => ({
		day,
		cost: Math.round(cost * 100) / 100,
	}));

	return {
		todayTokens,
		todayCost: Math.round(todayCost * 100) / 100,
		monthCost: Math.round(monthCost * 100) / 100,
		todayRecords: todayRecords.length,
		areaData,
		agentData,
		projectData,
		modelData,
		dailyData,
		hasData: records.length > 0,
	};
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<Card>
			<CardContent className="pt-4 pb-3 px-4">
				<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
				<p className="text-xl font-semibold mt-0.5 tabular-nums">{value}</p>
				{sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
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
				<code className="rounded-lg bg-muted px-4 py-2 font-mono text-sm">agentmon status</code>
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

	const d = await getDashboardData(supabase, user.id);

	return (
		<div className="p-4 max-w-6xl">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-lg font-semibold">Overview</h1>
				<span className="text-[11px] text-muted-foreground">
					* Input tokens may be underreported
				</span>
			</div>

			{!d.hasData ? (
				<EmptyState />
			) : (
				<>
					{/* Row 1: KPI */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
						<MetricCard label="Today's tokens" value={d.todayTokens.toLocaleString()} sub="input + output" />
						<MetricCard label="Today's cost" value={`$${d.todayCost.toFixed(2)}`} />
						<MetricCard label="Active sessions" value={String(d.todayRecords)} sub="5-min buckets" />
						<MetricCard label="This month" value={`$${d.monthCost.toFixed(2)}`} sub="cumulative" />
					</div>

					{/* Row 2: Usage trend */}
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Usage Trend (last 7 days)</CardTitle>
						</CardHeader>
						<CardContent>
							<UsageAreaChart data={d.areaData} />
						</CardContent>
					</Card>

					{/* Row 3: Distribution donuts */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
						<Card>
							<CardHeader><CardTitle className="text-sm">By Agent</CardTitle></CardHeader>
							<CardContent><DistributionDonut data={d.agentData} title="Agent" /></CardContent>
						</Card>
						<Card>
							<CardHeader><CardTitle className="text-sm">By Project</CardTitle></CardHeader>
							<CardContent><DistributionDonut data={d.projectData} title="Project" /></CardContent>
						</Card>
						<Card>
							<CardHeader><CardTitle className="text-sm">By Model</CardTitle></CardHeader>
							<CardContent><DistributionDonut data={d.modelData} title="Model" /></CardContent>
						</Card>
					</div>

					{/* Row 4: Daily cost */}
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>Daily Cost</CardTitle>
						</CardHeader>
						<CardContent>
							<DailyBarChart data={d.dailyData} />
						</CardContent>
					</Card>

					{/* Row 5: What if? */}
					<WhatIfCard />
				</>
			)}
		</div>
	);
}
