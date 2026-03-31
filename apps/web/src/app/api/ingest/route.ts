import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface IngestRecord {
	recorded_at: string;
	agent: string;
	project: string;
	model: string;
	input_tokens: number;
	output_tokens: number;
	cache_read_tokens: number;
	cache_creation_tokens: number;
	estimated_cost_usd: number;
}

export async function POST(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return NextResponse.json({ ok: false, error: "Missing API key" }, { status: 401 });
	}

	const apiKey = authHeader.slice(7);
	if (!apiKey.startsWith("am_")) {
		return NextResponse.json({ ok: false, error: "Invalid API key format" }, { status: 401 });
	}

	// Hash the key and look up
	const keyHash = createHash("sha256").update(apiKey).digest("hex");
	const { data: keyRecord, error: keyError } = await supabaseAdmin
		.from("api_keys")
		.select("user_id, revoked_at")
		.eq("key_hash", keyHash)
		.single();

	if (keyError || !keyRecord) {
		return NextResponse.json({ ok: false, error: "Invalid API key" }, { status: 401 });
	}

	if (keyRecord.revoked_at) {
		return NextResponse.json({ ok: false, error: "API key has been revoked" }, { status: 401 });
	}

	// Rate limit: 60 requests per minute per API key
	const { allowed, remaining, resetAt } = checkRateLimit(keyHash, 60, 60_000);
	if (!allowed) {
		return NextResponse.json(
			{ ok: false, error: "Rate limit exceeded. Try again later." },
			{
				status: 429,
				headers: {
					"Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
					"X-RateLimit-Remaining": "0",
				},
			},
		);
	}

	// Update last_used_at
	await supabaseAdmin
		.from("api_keys")
		.update({ last_used_at: new Date().toISOString() })
		.eq("key_hash", keyHash);

	// Parse body
	let body: { records?: IngestRecord[] };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	if (!body.records || !Array.isArray(body.records) || body.records.length === 0) {
		return NextResponse.json({ ok: false, error: "records array required" }, { status: 400 });
	}

	// Insert with ON CONFLICT DO NOTHING (server-side dedup)
	const rows = body.records.map((r) => ({
		user_id: keyRecord.user_id,
		recorded_at: r.recorded_at,
		agent: r.agent,
		project: r.project,
		model: r.model,
		input_tokens: r.input_tokens,
		output_tokens: r.output_tokens,
		cache_read_tokens: r.cache_read_tokens,
		cache_creation_tokens: r.cache_creation_tokens,
		estimated_cost_usd: r.estimated_cost_usd,
	}));

	const { error: insertError } = await supabaseAdmin
		.from("usage_records")
		.upsert(rows, {
			onConflict: "user_id,recorded_at,agent,project,model",
			ignoreDuplicates: true,
		});

	if (insertError) {
		console.error("Ingest insert error:", insertError);
		return NextResponse.json({ ok: false, error: "Insert failed" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, inserted: rows.length });
}
