"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UsageAreaChart } from "@/components/charts/usage-area-chart";

const PRESETS = [
	{ label: "Today", days: 1 },
	{ label: "7D", days: 7 },
	{ label: "30D", days: 30 },
	{ label: "90D", days: 90 },
];

interface UsageRecord {
	id: number;
	recorded_at: string;
	agent: string;
	project: string;
	model: string;
	input_tokens: number;
	output_tokens: number;
	cache_read_tokens: number;
	cache_creation_tokens: number;
	estimated_cost_usd: string;
}

export default function HistoryPage() {
	const [days, setDays] = useState(7);
	const [records, setRecords] = useState<UsageRecord[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			setLoading(true);
			const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
			const res = await fetch(`/api/usage?from=${from}`);
			const data = await res.json();
			if (data.ok) setRecords(data.data || []);
			setLoading(false);
		}
		load();
	}, [days]);

	// Area chart data
	const hourBuckets = new Map<string, { input: number; output: number; cacheRead: number }>();
	for (const r of records) {
		const d = new Date(r.recorded_at);
		const key =
			days <= 1
				? `${d.getHours().toString().padStart(2, "0")}:${(Math.floor(d.getMinutes() / 5) * 5).toString().padStart(2, "0")}`
				: `${(d.getMonth() + 1)}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:00`;
		const b = hourBuckets.get(key) || { input: 0, output: 0, cacheRead: 0 };
		b.input += r.input_tokens || 0;
		b.output += r.output_tokens || 0;
		b.cacheRead += r.cache_read_tokens || 0;
		hourBuckets.set(key, b);
	}
	const areaData = [...hourBuckets.entries()].map(([time, v]) => ({ time, ...v }));

	return (
		<div className="p-6 max-w-6xl">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Usage History</h1>
				<div className="flex gap-1">
					{PRESETS.map((p) => (
						<Button
							key={p.days}
							variant={days === p.days ? "default" : "outline"}
							size="sm"
							onClick={() => setDays(p.days)}
						>
							{p.label}
						</Button>
					))}
				</div>
			</div>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Token Usage</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
					) : (
						<UsageAreaChart data={areaData} />
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Records ({records.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Time</TableHead>
								<TableHead>Agent</TableHead>
								<TableHead>Project</TableHead>
								<TableHead>Model</TableHead>
								<TableHead className="text-right">Tokens</TableHead>
								<TableHead className="text-right">Cost</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{records.slice(0, 100).map((r) => (
								<TableRow key={r.id}>
									<TableCell className="text-xs">
										{new Date(r.recorded_at).toLocaleString()}
									</TableCell>
									<TableCell>
										<Badge variant="secondary">{r.agent}</Badge>
									</TableCell>
									<TableCell className="text-xs max-w-32 truncate">{r.project}</TableCell>
									<TableCell className="text-xs">{r.model}</TableCell>
									<TableCell className="text-right text-xs">
										{((r.input_tokens || 0) + (r.output_tokens || 0)).toLocaleString()}
									</TableCell>
									<TableCell className="text-right text-xs">
										${Number(r.estimated_cost_usd || 0).toFixed(4)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					{records.length > 100 && (
						<p className="text-xs text-muted-foreground text-center mt-4">
							Showing first 100 of {records.length} records
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
