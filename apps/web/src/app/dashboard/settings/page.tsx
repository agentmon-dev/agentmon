"use client";

import { useState, useEffect } from "react";

interface ApiKey {
	id: string;
	name: string;
	last_used_at: string | null;
	created_at: string;
	revoked_at: string | null;
}

export default function SettingsPage() {
	const [keys, setKeys] = useState<ApiKey[]>([]);
	const [newKeyName, setNewKeyName] = useState("");
	const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function loadKeys() {
		const res = await fetch("/api/keys");
		const data = await res.json();
		if (data.ok) setKeys(data.keys);
	}

	useEffect(() => {
		loadKeys();
	}, []);

	async function createKey(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const res = await fetch("/api/keys", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newKeyName || "default" }),
		});
		const data = await res.json();
		setLoading(false);

		if (data.ok) {
			setNewKeyValue(data.key);
			setNewKeyName("");
			loadKeys();
		}
	}

	async function revokeKey(id: string) {
		await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
		loadKeys();
	}

	return (
		<div className="p-6 max-w-2xl">
			<h1 className="text-2xl font-bold mb-6">Settings</h1>

			<section>
				<h2 className="text-lg font-semibold mb-4">API Keys</h2>

				{/* New key warning */}
				{newKeyValue && (
					<div className="mb-4 rounded-lg border-2 border-[hsl(var(--destructive))] p-4">
						<p className="text-sm font-medium mb-2">
							Save this key now. It will not be shown again.
						</p>
						<code className="block rounded bg-[hsl(var(--muted))] p-3 text-sm font-mono break-all">
							{newKeyValue}
						</code>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(newKeyValue);
							}}
							className="mt-2 text-xs text-[hsl(var(--primary))] hover:underline"
						>
							Copy to clipboard
						</button>
						<button
							type="button"
							onClick={() => setNewKeyValue(null)}
							className="mt-2 ml-4 text-xs text-[hsl(var(--muted-foreground))] hover:underline"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Create form */}
				<form onSubmit={createKey} className="flex gap-2 mb-6">
					<input
						type="text"
						value={newKeyName}
						onChange={(e) => setNewKeyName(e.target.value)}
						placeholder="Key name (e.g. macbook-pro)"
						className="flex-1 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
					/>
					<button
						type="submit"
						disabled={loading}
						className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
					>
						Create key
					</button>
				</form>

				{/* Key list */}
				<div className="space-y-2">
					{keys.map((key) => (
						<div
							key={key.id}
							className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"
						>
							<div>
								<span className="text-sm font-medium">{key.name}</span>
								<span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">
									{key.revoked_at ? "Revoked" : key.last_used_at
										? `Last used ${new Date(key.last_used_at).toLocaleDateString()}`
										: "Never used"}
								</span>
							</div>
							{!key.revoked_at && (
								<button
									type="button"
									onClick={() => revokeKey(key.id)}
									className="text-xs text-[hsl(var(--destructive))] hover:underline"
								>
									Revoke
								</button>
							)}
						</div>
					))}
					{keys.length === 0 && (
						<p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
							No API keys yet. Create one to start collecting data.
						</p>
					)}
				</div>
			</section>
		</div>
	);
}
