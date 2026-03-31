import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const { data, error } = await supabase
		.from("org_members")
		.select("role, organizations(id, slug, name, visibility)")
		.eq("user_id", user.id);

	if (error) {
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	const orgs = (data || []).map((m: any) => ({
		...m.organizations,
		role: m.role,
	}));

	return NextResponse.json({ ok: true, orgs });
}

export async function POST(request: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	let body: { name?: string; slug?: string; visibility?: string };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	if (!body.name || !body.slug) {
		return NextResponse.json({ ok: false, error: "name and slug required" }, { status: 400 });
	}

	// Create org
	const { data: org, error: orgError } = await supabase
		.from("organizations")
		.insert({
			name: body.name,
			slug: body.slug,
			visibility: body.visibility || "public",
			created_by: user.id,
		})
		.select()
		.single();

	if (orgError) {
		if (orgError.code === "23505") {
			return NextResponse.json({ ok: false, error: "Slug already taken" }, { status: 409 });
		}
		return NextResponse.json({ ok: false, error: orgError.message }, { status: 500 });
	}

	// Add creator as owner
	await supabase.from("org_members").insert({
		org_id: org.id,
		user_id: user.id,
		role: "owner",
	});

	return NextResponse.json({ ok: true, org });
}
