"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function OrgSettingsPage() {
	const { slug } = useParams<{ slug: string }>();
	const router = useRouter();
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		async function load() {
			const res = await fetch("/api/org");
			const data = await res.json();
			if (data.ok) {
				const org = data.orgs.find((o: any) => o.slug === slug);
				if (org) setName(org.name);
			}
		}
		load();
	}, [slug]);

	async function handleDelete() {
		if (!confirm("Are you sure? This will delete the organization and remove all members.")) {
			return;
		}
		setLoading(true);
		// TODO: implement DELETE /api/org/[slug]
		alert("Organization deletion not yet implemented");
		setLoading(false);
	}

	return (
		<div className="p-6 max-w-lg mx-auto">
			<h1 className="text-2xl font-bold mb-6">Organization Settings</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="text-sm">General</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1" htmlFor="org-name">
							Organization name
						</label>
						<Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">URL slug</label>
						<p className="text-sm text-muted-foreground">agentmon.dev/org/{slug}</p>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
				</CardContent>
			</Card>

			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-4">
						Deleting this organization will remove all members and their association.
						Usage data belongs to individual users and will not be deleted.
					</p>
					<Button variant="destructive" onClick={handleDelete} disabled={loading}>
						{loading ? "Deleting..." : "Delete organization"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
