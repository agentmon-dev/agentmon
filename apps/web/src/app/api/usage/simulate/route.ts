import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRICING, estimateCost } from "@agentmon/shared";

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
	const targetModel = searchParams.get("target_model");

	if (!targetModel) {
		return NextResponse.json(
			{ ok: false, error: "target_model parameter required" },
			{ status: 400 },
		);
	}

	if (!PRICING[targetModel]) {
		return NextResponse.json(
			{
				ok: false,
				error: `Unknown model: ${targetModel}. Available: ${Object.keys(PRICING).join(", ")}`,
			},
			{ status: 400 },
		);
	}

	const { data, error } = await supabase
		.from("usage_records")
		.select("input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, estimated_cost_usd")
		.eq("user_id", user.id)
		.gte("recorded_at", from.toISOString())
		.lte("recorded_at", to.toISOString());

	if (error) {
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	if (!data || data.length === 0) {
		return NextResponse.json({
			ok: true,
			actual_cost_usd: 0,
			simulated_cost_usd: 0,
			savings_usd: 0,
			target_model: targetModel,
		});
	}

	let actualCost = 0;
	let simulatedCost = 0;

	for (const row of data) {
		actualCost += Number(row.estimated_cost_usd) || 0;
		simulatedCost += estimateCost(targetModel, {
			input: row.input_tokens || 0,
			output: row.output_tokens || 0,
			cacheRead: row.cache_read_tokens || 0,
			cacheCreation: row.cache_creation_tokens || 0,
		});
	}

	return NextResponse.json({
		ok: true,
		actual_cost_usd: Math.round(actualCost * 100) / 100,
		simulated_cost_usd: Math.round(simulatedCost * 100) / 100,
		savings_usd: Math.round((actualCost - simulatedCost) * 100) / 100,
		target_model: targetModel,
	});
}
