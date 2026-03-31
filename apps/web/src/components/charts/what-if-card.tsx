"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MODELS = [
	{ value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
	{ value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
	{ value: "claude-opus-4-6", label: "Claude Opus 4.6" },
];

interface SimulationResult {
	actual_cost_usd: number;
	simulated_cost_usd: number;
	savings_usd: number;
	target_model: string;
}

export function WhatIfCard() {
	const [targetModel, setTargetModel] = useState("claude-sonnet-4-6");
	const [result, setResult] = useState<SimulationResult | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		async function simulate() {
			setLoading(true);
			try {
				const res = await fetch(`/api/usage/simulate?target_model=${targetModel}`);
				const data = await res.json();
				if (data.ok) setResult(data);
			} catch {
				// ignore
			}
			setLoading(false);
		}
		simulate();
	}, [targetModel]);

	const savings = result?.savings_usd ?? 0;
	const isPositive = savings > 0;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle>What if?</CardTitle>
				<select
					value={targetModel}
					onChange={(e) => setTargetModel(e.target.value)}
					className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
				>
					{MODELS.map((m) => (
						<option key={m.value} value={m.value}>
							{m.label}
						</option>
					))}
				</select>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-muted-foreground">Calculating...</p>
				) : result ? (
					<div className="flex items-baseline gap-4">
						<div>
							<p className="text-xs text-muted-foreground">Actual cost</p>
							<p className="text-lg font-bold">${result.actual_cost_usd.toFixed(2)}</p>
						</div>
						<div className="text-2xl text-muted-foreground">&rarr;</div>
						<div>
							<p className="text-xs text-muted-foreground">With {MODELS.find((m) => m.value === targetModel)?.label}</p>
							<p className="text-lg font-bold">${result.simulated_cost_usd.toFixed(2)}</p>
						</div>
						<div className="ml-auto text-right">
							<p className="text-xs text-muted-foreground">
								{isPositive ? "You'd save" : "Extra cost"}
							</p>
							<p className={`text-xl font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
								{isPositive ? "-" : "+"}${Math.abs(savings).toFixed(2)}
							</p>
						</div>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">No data for this period</p>
				)}
			</CardContent>
		</Card>
	);
}
