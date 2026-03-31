import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function OrgDashboardPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/auth/login");

	const { data: org } = await supabase
		.from("organizations")
		.select("id, name, slug")
		.eq("slug", slug)
		.single();

	if (!org) notFound();

	const { data: membership } = await supabase
		.from("org_members")
		.select("role")
		.eq("org_id", org.id)
		.eq("user_id", user.id)
		.single();

	if (!membership) {
		return (
			<div className="p-6 text-center">
				<p>You are not a member of this organization.</p>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-6xl">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold">{org.name}</h1>
					<p className="text-sm text-[hsl(var(--muted-foreground))]">/{org.slug}</p>
				</div>
				<div className="flex gap-2">
					<Link
						href={`/org/${slug}/members`}
						className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))]"
					>
						Members
					</Link>
					{["owner", "admin"].includes(membership.role) && (
						<Link
							href={`/org/${slug}/settings`}
							className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))]"
						>
							Settings
						</Link>
					)}
				</div>
			</div>

			<div className="rounded-lg border border-[hsl(var(--border))] p-8 text-center text-[hsl(var(--muted-foreground))]">
				Organization dashboard - aggregated member usage will appear here
			</div>
		</div>
	);
}
