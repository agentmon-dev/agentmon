"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Member {
	role: string;
	joined_at: string;
	users: {
		id: string;
		github_username: string;
		display_name: string | null;
		avatar_url: string | null;
	};
}

export default function MembersPage() {
	const { slug } = useParams<{ slug: string }>();
	const [members, setMembers] = useState<Member[]>([]);
	const [inviteUsername, setInviteUsername] = useState("");
	const [inviteError, setInviteError] = useState("");
	const [inviteSuccess, setInviteSuccess] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			const res = await fetch(`/api/org/${slug}/members`);
			const data = await res.json();
			if (data.ok) setMembers(data.members || []);
			setLoading(false);
		}
		load();
	}, [slug]);

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault();
		setInviteError("");
		setInviteSuccess("");

		const res = await fetch(`/api/org/${slug}/invite`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ github_username: inviteUsername }),
		});
		const data = await res.json();

		if (data.ok) {
			setInviteSuccess(`Invite sent: ${data.invite_url}`);
			setInviteUsername("");
		} else {
			setInviteError(data.error);
		}
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Members</h1>

			{/* Invite */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="text-sm">Invite Member</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleInvite} className="flex gap-2">
						<Input
							value={inviteUsername}
							onChange={(e) => setInviteUsername(e.target.value)}
							placeholder="GitHub username"
							className="flex-1"
						/>
						<Button type="submit">Invite</Button>
					</form>
					{inviteError && <p className="text-sm text-destructive mt-2">{inviteError}</p>}
					{inviteSuccess && <p className="text-sm text-green-600 mt-2">{inviteSuccess}</p>}
				</CardContent>
			</Card>

			{/* Members list */}
			<Card>
				<CardHeader>
					<CardTitle>Members ({members.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-muted-foreground">Loading...</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Joined</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{members.map((m) => (
									<TableRow key={m.users.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8">
													<AvatarImage src={m.users.avatar_url || undefined} />
													<AvatarFallback>
														{(m.users.display_name || m.users.github_username).charAt(0).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-sm font-medium">{m.users.display_name || m.users.github_username}</p>
													<p className="text-xs text-muted-foreground">@{m.users.github_username}</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={m.role === "owner" ? "default" : "secondary"}>
												{m.role}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{new Date(m.joined_at).toLocaleDateString()}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
