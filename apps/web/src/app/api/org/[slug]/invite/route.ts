import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";

export async function POST(
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

	const { data: org } = await supabase
		.from("organizations")
		.select("id")
		.eq("slug", slug)
		.single();

	if (!org) {
		return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 404 });
	}

	// Check permission (owner/admin only)
	const { data: membership } = await supabase
		.from("org_members")
		.select("role")
		.eq("org_id", org.id)
		.eq("user_id", user.id)
		.single();

	if (!membership || !["owner", "admin"].includes(membership.role)) {
		return NextResponse.json({ ok: false, error: "Insufficient permissions" }, { status: 403 });
	}

	let body: { github_username?: string; role?: string };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	if (!body.github_username) {
		return NextResponse.json({ ok: false, error: "github_username required" }, { status: 400 });
	}

	// Look up user by github_username
	const { data: invitedUser } = await supabase
		.from("users")
		.select("id")
		.eq("github_username", body.github_username)
		.single();

	const token = randomBytes(16).toString("hex");

	const { error } = await supabase.from("org_invites").insert({
		org_id: org.id,
		invited_user_id: invitedUser?.id || null,
		invited_email: null,
		role: body.role || "member",
		token,
		invited_by: user.id,
	});

	if (error) {
		if (error.code === "23505") {
			return NextResponse.json({ ok: false, error: "Already invited" }, { status: 409 });
		}
		return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
	}

	return NextResponse.json({
		ok: true,
		invite_url: `https://agentmon.dev/invite/${token}`,
	});
}

// Accept invite
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	await params; // consume params
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	let body: { token?: string };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	if (!body.token) {
		return NextResponse.json({ ok: false, error: "token required" }, { status: 400 });
	}

	const { data: invite } = await supabase
		.from("org_invites")
		.select("*")
		.eq("token", body.token)
		.eq("status", "pending")
		.single();

	if (!invite) {
		return NextResponse.json({ ok: false, error: "Invalid or expired invite" }, { status: 400 });
	}

	if (new Date(invite.expires_at) < new Date()) {
		await supabase.from("org_invites").update({ status: "expired" }).eq("id", invite.id);
		return NextResponse.json({ ok: false, error: "Invite expired" }, { status: 400 });
	}

	// Add member
	await supabase.from("org_members").insert({
		org_id: invite.org_id,
		user_id: user.id,
		role: invite.role,
	});

	// Mark invite accepted
	await supabase.from("org_invites").update({ status: "accepted" }).eq("id", invite.id);

	return NextResponse.json({ ok: true });
}
