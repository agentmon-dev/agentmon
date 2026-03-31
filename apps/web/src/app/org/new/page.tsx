"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function toSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export default function NewOrgPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [autoSlug, setAutoSlug] = useState(true);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function handleNameChange(value: string) {
		setName(value);
		if (autoSlug) setSlug(toSlug(value));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const res = await fetch("/api/org", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, slug, visibility: "public" }),
		});

		const data = await res.json();
		setLoading(false);

		if (!data.ok) {
			setError(data.error);
			return;
		}

		router.push(`/org/${slug}`);
	}

	return (
		<div className="p-6 max-w-lg mx-auto">
			<Card>
				<CardHeader>
					<CardTitle>Create organization</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="org-name">
								Name
							</label>
							<Input
								id="org-name"
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder="My Team"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="org-slug">
								URL slug
							</label>
							<div className="flex items-center gap-1 text-sm">
								<span className="text-muted-foreground">agentmon.dev/org/</span>
								<Input
									id="org-slug"
									value={slug}
									onChange={(e) => {
										setAutoSlug(false);
										setSlug(e.target.value);
									}}
									pattern="[a-z0-9-]+"
									required
								/>
							</div>
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? "Creating..." : "Create organization"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
