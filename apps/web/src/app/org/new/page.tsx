"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
			<h1 className="text-2xl font-bold mb-6">Create organization</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="org-name">
						Name
					</label>
					<input
						id="org-name"
						type="text"
						value={name}
						onChange={(e) => handleNameChange(e.target.value)}
						className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
						placeholder="My Team"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="org-slug">
						URL slug
					</label>
					<div className="flex items-center text-sm">
						<span className="text-[hsl(var(--muted-foreground))] mr-1">agentmon.dev/org/</span>
						<input
							id="org-slug"
							type="text"
							value={slug}
							onChange={(e) => {
								setAutoSlug(false);
								setSlug(e.target.value);
							}}
							className="flex-1 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2"
							pattern="[a-z0-9-]+"
							required
						/>
					</div>
				</div>

				{error && (
					<p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full rounded-md bg-[hsl(var(--primary))] py-2 text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
				>
					{loading ? "Creating..." : "Create organization"}
				</button>
			</form>
		</div>
	);
}
