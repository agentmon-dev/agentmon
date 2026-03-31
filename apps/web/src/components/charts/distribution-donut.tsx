"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";

const COLORS = [
	"var(--color-chart-1)",
	"var(--color-chart-2)",
	"var(--color-chart-3)",
	"var(--color-chart-4)",
	"var(--color-chart-5)",
];

interface Slice {
	name: string;
	value: number;
}

export function DistributionDonut({
	data,
	title,
}: {
	data: Slice[];
	title: string;
}) {
	if (data.length === 0) return null;

	const config: ChartConfig = Object.fromEntries(
		data.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]),
	);

	return (
		<ChartContainer config={config} className="h-40 w-full">
			<PieChart>
				<ChartTooltip content={<ChartTooltipContent hideLabel />} />
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					innerRadius={35}
					outerRadius={60}
					paddingAngle={2}
				>
					{data.map((_, i) => (
						<Cell key={data[i].name} fill={COLORS[i % COLORS.length]} />
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}
