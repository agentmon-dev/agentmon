"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
	cost: { label: "Cost ($)", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

interface DataPoint {
	day: string;
	cost: number;
}

export function DailyBarChart({ data }: { data: DataPoint[] }) {
	if (data.length === 0) return null;

	return (
		<ChartContainer config={chartConfig} className="h-48 w-full">
			<BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
				<CartesianGrid vertical={false} />
				<XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
				<YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="cost" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ChartContainer>
	);
}
