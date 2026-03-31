import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes, createHash } from "node:crypto";

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const port = searchParams.get("port");
	const state = searchParams.get("state");

	if (!port || !state) {
		return NextResponse.json({ ok: false, error: "Missing port or state" }, { status: 400 });
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		// Redirect to login, then back here
		const returnUrl = `/auth/cli?port=${port}&state=${state}`;
		return NextResponse.redirect(
			new URL(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`, request.url),
		);
	}

	// Generate API key for CLI
	const rawKey = `am_${randomBytes(24).toString("hex")}`;
	const keyHash = createHash("sha256").update(rawKey).digest("hex");

	await supabase.from("api_keys").insert({
		user_id: user.id,
		key_hash: keyHash,
		name: `cli-${new Date().toISOString().slice(0, 10)}`,
	});

	// Redirect to CLI's local callback
	const callbackUrl = `http://localhost:${port}/callback?api_key=${rawKey}&state=${state}`;
	return NextResponse.redirect(callbackUrl);
}
