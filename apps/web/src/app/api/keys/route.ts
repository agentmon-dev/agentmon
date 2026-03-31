import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes, createHash } from "node:crypto";

export async function GET() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const { data, error } = await supabase
		.from("api_keys")
		.select("id, name, last_used_at, created_at, revoked_at")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	if (error) {
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	return NextResponse.json({ ok: true, keys: data });
}

export async function POST(request: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	let body: { name?: string };
	try {
		body = await request.json();
	} catch {
		body = {};
	}

	const name = body.name || "default";

	// Generate API key
	const rawKey = `am_${randomBytes(24).toString("hex")}`;
	const keyHash = createHash("sha256").update(rawKey).digest("hex");

	const { error } = await supabase.from("api_keys").insert({
		user_id: user.id,
		key_hash: keyHash,
		name,
	});

	if (error) {
		if (error.code === "23505") {
			return NextResponse.json(
				{ ok: false, error: `Key with name "${name}" already exists` },
				{ status: 409 },
			);
		}
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	// Return plaintext key ONCE
	return NextResponse.json({ ok: true, key: rawKey, name });
}

export async function DELETE(request: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const keyId = searchParams.get("id");

	if (!keyId) {
		return NextResponse.json({ ok: false, error: "id parameter required" }, { status: 400 });
	}

	// Soft revoke
	const { error } = await supabase
		.from("api_keys")
		.update({ revoked_at: new Date().toISOString() })
		.eq("id", keyId)
		.eq("user_id", user.id);

	if (error) {
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
