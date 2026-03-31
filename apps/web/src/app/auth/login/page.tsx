"use client";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

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
			<div className="text-center">
				<h1 className="text-3xl font-bold mb-2">Sign in to agentmon</h1>
				<p className="text-[hsl(var(--muted-foreground))] mb-8">
					Monitor your AI coding agent token usage
				</p>
				<button
					type="button"
					onClick={handleLogin}
					className="rounded-md bg-[hsl(var(--foreground))] px-6 py-3 text-[hsl(var(--background))] hover:opacity-90 transition-opacity"
				>
					Continue with GitHub
				</button>
			</div>
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
