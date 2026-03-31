"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

			<Card>
				<CardHeader>
					<CardTitle>API Keys</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* New key warning */}
					{newKeyValue && (
						<Card className="border-destructive border-2">
							<CardContent className="pt-4">
								<p className="text-sm font-medium mb-2">
									Save this key now. It will not be shown again.
								</p>
								<code className="block rounded-lg bg-muted p-3 text-sm font-mono break-all">
									{newKeyValue}
								</code>
								<div className="flex gap-2 mt-3">
									<Button
										variant="outline"
										size="sm"
										onClick={() => navigator.clipboard.writeText(newKeyValue)}
									>
										Copy
									</Button>
									<Button variant="ghost" size="sm" onClick={() => setNewKeyValue(null)}>
										Dismiss
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Create form */}
					<form onSubmit={createKey} className="flex gap-2">
						<Input
							value={newKeyName}
							onChange={(e) => setNewKeyName(e.target.value)}
							placeholder="Key name (e.g. macbook-pro)"
							className="flex-1"
						/>
						<Button type="submit" disabled={loading}>
							{loading ? "Creating..." : "Create key"}
						</Button>
					</form>

					{/* Key list */}
					<div className="space-y-2">
						{keys.map((key) => (
							<div
								key={key.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">{key.name}</span>
									{key.revoked_at ? (
										<Badge variant="destructive">Revoked</Badge>
									) : (
										<Badge variant="secondary">
											{key.last_used_at
												? `Used ${new Date(key.last_used_at).toLocaleDateString()}`
												: "Never used"}
										</Badge>
									)}
								</div>
								{!key.revoked_at && (
									<Button variant="ghost" size="sm" onClick={() => revokeKey(key.id)}>
										Revoke
									</Button>
								)}
							</div>
						))}
						{keys.length === 0 && (
							<p className="text-sm text-muted-foreground text-center py-4">
								No API keys yet. Create one to start collecting data.
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
