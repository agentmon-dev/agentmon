import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = ["/dashboard", "/org"];
const AUTH_API_ROUTES = ["/api/usage", "/api/keys", "/api/org"];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// /api/ingest uses API key auth, not session
	if (pathname === "/api/ingest") {
		return NextResponse.next();
	}

	const isProtectedPage = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
	const isProtectedAPI = AUTH_API_ROUTES.some((route) => pathname.startsWith(route));

	if (!isProtectedPage && !isProtectedAPI) {
		return NextResponse.next();
	}

	let response = NextResponse.next({
		request: { headers: request.headers },
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					response = NextResponse.next({
						request: { headers: request.headers },
					});
					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	// Check session
	const checkSession = async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			if (isProtectedAPI) {
				return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
			}
			const loginUrl = new URL("/auth/login", request.url);
			loginUrl.searchParams.set("redirect", pathname);
			return NextResponse.redirect(loginUrl);
		}

		return response;
	};

	// proxy.ts in Next.js 16 supports async
	return checkSession();
}

export const config = {
	matcher: ["/dashboard/:path*", "/org/:path*", "/api/usage/:path*", "/api/keys/:path*", "/api/org/:path*"],
};
