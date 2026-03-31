"use client";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect") || "/dashboard";

	async function handleLogin() {
		const supabase = createClient();
		await supabase.auth.signInWithOAuth({
			provider: "github",
			options: {
				redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
			},
		});
	}

	return (
		<main className="flex min-h-screen items-center justify-center">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Sign in to agentmon</CardTitle>
					<p className="text-sm text-muted-foreground">
						Monitor your AI coding agent token usage
					</p>
				</CardHeader>
				<CardContent>
					<Button onClick={handleLogin} className="w-full" size="lg">
						Continue with GitHub
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}

export default function LoginPage() {
	return (
		<Suspense>
			<LoginForm />
		</Suspense>
	);
}
