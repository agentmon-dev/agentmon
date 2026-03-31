import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OrgsPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/auth/login");

	const { data: memberships } = await supabase
		.from("org_members")
		.select("role, organizations(id, slug, name, visibility)")
		.eq("user_id", user.id);

	const orgs = (memberships || []).map((m: any) => ({
		...m.organizations,
		role: m.role,
	}));

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Organizations</h1>
				<Link
					href="/org/new"
					className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm text-[hsl(var(--primary-foreground))] hover:opacity-90"
				>
					New organization
				</Link>
			</div>

			{orgs.length === 0 ? (
				<div className="text-center py-16">
					<p className="text-[hsl(var(--muted-foreground))] mb-4">
						You're not in any organizations yet.
					</p>
					<Link
						href="/org/new"
						className="text-[hsl(var(--primary))] hover:underline"
					>
						Create your first organization
					</Link>
				</div>
			) : (
				<div className="space-y-2">
					{orgs.map((org: any) => (
						<Link
							key={org.id}
							href={`/org/${org.slug}`}
							className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-4 hover:bg-[hsl(var(--muted))] transition-colors"
						>
							<div>
								<span className="font-medium">{org.name}</span>
								<span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">
									/{org.slug}
								</span>
							</div>
							<span className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
								{org.role}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
