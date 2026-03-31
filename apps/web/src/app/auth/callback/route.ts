import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const code = searchParams.get("code");
	const redirect = searchParams.get("redirect") || "/dashboard";

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// public.users row is created automatically by DB trigger (handle_new_user)
			return NextResponse.redirect(new URL(redirect, request.url));
		}
	}

	return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url));
}
