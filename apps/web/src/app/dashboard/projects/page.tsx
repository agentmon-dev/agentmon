"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DistributionDonut } from "@/components/charts/distribution-donut";

interface ProjectSummary {
	name: string;
	totalTokens: number;
	cost: number;
	agents: Set<string>;
	models: Set<string>;
	records: number;
}

export default function ProjectsPage() {
	const [projects, setProjects] = useState<ProjectSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
			const res = await fetch(`/api/usage?from=${from}`);
			const data = await res.json();

			if (data.ok) {
				const map = new Map<string, ProjectSummary>();
				for (const r of data.data || []) {
					const p = map.get(r.project) || {
						name: r.project,
						totalTokens: 0,
						cost: 0,
						agents: new Set<string>(),
						models: new Set<string>(),
						records: 0,
					};
					p.totalTokens += (r.input_tokens || 0) + (r.output_tokens || 0);
					p.cost += Number(r.estimated_cost_usd || 0);
					p.agents.add(r.agent);
					p.models.add(r.model);
					p.records += 1;
					map.set(r.project, p);
				}
				setProjects([...map.values()].sort((a, b) => b.cost - a.cost));
			}
			setLoading(false);
		}
		load();
	}, []);

	const donutData = projects.slice(0, 5).map((p) => ({
		name: p.name.length > 20 ? `${p.name.slice(0, 20)}...` : p.name,
		value: p.totalTokens,
	}));

	return (
		<div className="p-6 max-w-6xl">
			<h1 className="text-2xl font-bold mb-6">Projects (last 30 days)</h1>

			{loading ? (
				<p className="text-muted-foreground">Loading...</p>
			) : projects.length === 0 ? (
				<Card className="py-12">
					<CardContent className="text-center text-muted-foreground">
						No project data yet.
					</CardContent>
				</Card>
			) : (
				<>
					<Card className="mb-8">
						<CardHeader>
							<CardTitle className="text-sm">Token Distribution by Project</CardTitle>
						</CardHeader>
						<CardContent>
							<DistributionDonut data={donutData} title="Projects" />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>All Projects ({projects.length})</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Project</TableHead>
										<TableHead>Agents</TableHead>
										<TableHead>Models</TableHead>
										<TableHead className="text-right">Tokens</TableHead>
										<TableHead className="text-right">Cost</TableHead>
										<TableHead className="text-right">Sessions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{projects.map((p) => (
										<TableRow key={p.name}>
											<TableCell className="font-medium max-w-48 truncate">{p.name}</TableCell>
											<TableCell>
												<div className="flex gap-1 flex-wrap">
													{[...p.agents].map((a) => (
														<Badge key={a} variant="secondary" className="text-xs">
															{a}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell className="text-xs">{[...p.models].join(", ")}</TableCell>
											<TableCell className="text-right">{p.totalTokens.toLocaleString()}</TableCell>
											<TableCell className="text-right">${p.cost.toFixed(2)}</TableCell>
											<TableCell className="text-right">{p.records}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
