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
			// Ensure user record exists
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				await supabase.from("users").upsert(
					{
						id: user.id,
						github_username: user.user_metadata?.user_name || user.email || "unknown",
						display_name: user.user_metadata?.full_name || null,
						avatar_url: user.user_metadata?.avatar_url || null,
					},
					{ onConflict: "id" },
				);
			}

			return NextResponse.redirect(new URL(redirect, request.url));
		}
	}

	return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url));
}
