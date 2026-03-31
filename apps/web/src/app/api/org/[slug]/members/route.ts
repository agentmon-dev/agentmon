import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const { data: org } = await supabase
		.from("organizations")
		.select("id")
		.eq("slug", slug)
		.single();

	if (!org) {
		return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 404 });
	}

	// Check membership
	const { data: membership } = await supabase
		.from("org_members")
		.select("role")
		.eq("org_id", org.id)
		.eq("user_id", user.id)
		.single();

	if (!membership) {
		return NextResponse.json({ ok: false, error: "Not a member" }, { status: 403 });
	}

	const { data: members, error } = await supabase
		.from("org_members")
		.select("role, joined_at, users(id, github_username, display_name, avatar_url)")
		.eq("org_id", org.id);

	if (error) {
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	return NextResponse.json({ ok: true, members });
}
