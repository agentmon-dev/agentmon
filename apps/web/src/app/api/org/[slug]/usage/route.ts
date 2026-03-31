import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
	request: NextRequest,
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

	// Check membership
	const { data: org } = await supabase
		.from("organizations")
		.select("id")
		.eq("slug", slug)
		.single();

	if (!org) {
		return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 404 });
	}

	const { data: membership } = await supabase
		.from("org_members")
		.select("role")
		.eq("org_id", org.id)
		.eq("user_id", user.id)
		.single();

	if (!membership) {
		return NextResponse.json({ ok: false, error: "Not a member" }, { status: 403 });
	}

	const { searchParams } = request.nextUrl;
	const now = new Date();
	const from = searchParams.get("from")
		? new Date(searchParams.get("from")!)
		: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now;

	// Get all member user_ids
	const { data: members } = await supabase
		.from("org_members")
		.select("user_id")
		.eq("org_id", org.id);

	const memberIds = (members || []).map((m) => m.user_id);

	// Query usage for all members
	const { data, error } = await supabase
		.from("usage_records")
		.select("*")
		.in("user_id", memberIds)
		.gte("recorded_at", from.toISOString())
		.lte("recorded_at", to.toISOString())
		.order("recorded_at", { ascending: true });

	if (error) {
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	return NextResponse.json({
		ok: true,
		data,
		meta: { from: from.toISOString(), to: to.toISOString(), member_count: memberIds.length },
	});
}
