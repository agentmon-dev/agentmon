import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function autoGranularity(from: Date, to: Date): string {
	const diffMs = to.getTime() - from.getTime();
	const diffDays = diffMs / (1000 * 60 * 60 * 24);
	if (diffDays <= 1) return "5min";
	if (diffDays <= 7) return "hour";
	if (diffDays <= 90) return "day";
	return "week";
}

function truncateSQL(granularity: string): string {
	switch (granularity) {
		case "5min":
			return "date_trunc('hour', recorded_at) + (extract(minute from recorded_at)::int / 5 * interval '5 min')";
		case "hour":
			return "date_trunc('hour', recorded_at)";
		case "day":
			return "date_trunc('day', recorded_at)";
		case "week":
			return "date_trunc('week', recorded_at)";
		case "month":
			return "date_trunc('month', recorded_at)";
		default:
			return "date_trunc('day', recorded_at)";
	}
}

export async function GET(request: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const now = new Date();
	const from = searchParams.get("from")
		? new Date(searchParams.get("from")!)
		: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now;
	const granularity = searchParams.get("granularity") || autoGranularity(from, to);
	const agentFilter = searchParams.get("agent");
	const projectFilter = searchParams.get("project");
	const modelFilter = searchParams.get("model");

	let query = supabase
		.from("usage_records")
		.select("*")
		.eq("user_id", user.id)
		.gte("recorded_at", from.toISOString())
		.lte("recorded_at", to.toISOString())
		.order("recorded_at", { ascending: true });

	if (agentFilter && agentFilter !== "all") {
		query = query.eq("agent", agentFilter);
	}
	if (projectFilter && projectFilter !== "all") {
		query = query.eq("project", projectFilter);
	}
	if (modelFilter && modelFilter !== "all") {
		query = query.eq("model", modelFilter);
	}

	const { data, error } = await query;

	if (error) {
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	return NextResponse.json({
		ok: true,
		data,
		meta: { from: from.toISOString(), to: to.toISOString(), granularity },
	});
}
