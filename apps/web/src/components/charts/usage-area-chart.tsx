"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
	output: { label: "Output", color: "var(--color-chart-1)" },
	input: { label: "Input", color: "var(--color-chart-2)" },
	cacheRead: { label: "Cache Read", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

interface DataPoint {
	time: string;
	input: number;
	output: number;
	cacheRead: number;
}

export function UsageAreaChart({ data }: { data: DataPoint[] }) {
	if (data.length === 0) return null;

	return (
		<ChartContainer config={chartConfig} className="h-64 w-full">
			<AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
				<CartesianGrid vertical={false} />
				<XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
				<YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
				<Area
					dataKey="output"
					type="monotone"
					fill="var(--color-chart-1)"
					fillOpacity={0.3}
					stroke="var(--color-chart-1)"
					stackId="tokens"
				/>
				<Area
					dataKey="input"
					type="monotone"
					fill="var(--color-chart-2)"
					fillOpacity={0.3}
					stroke="var(--color-chart-2)"
					stackId="tokens"
				/>
				<Area
					dataKey="cacheRead"
					type="monotone"
					fill="var(--color-chart-3)"
					fillOpacity={0.3}
					stroke="var(--color-chart-3)"
					stackId="tokens"
				/>
			</AreaChart>
		</ChartContainer>
	);
}
