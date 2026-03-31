import { homedir } from "node:os";
import { join } from "node:path";
import { chmod } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { CONFIG_PATH, ensureConfigDir } from "../config.js";
import {
	detectPlatform,
	getDaemonManager,
	type Platform,
} from "../system/platform.js";

const AUTH_BASE_URL = "https://agentmon.dev/auth";
const CALLBACK_TIMEOUT_MS = 120_000; // 2 minutes

interface InitOptions {
	noBrowser?: boolean;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
	console.log("agentmon init - setting up your account and daemon\n");

	// 1. Detect OS
	let platform: Platform;
	try {
		platform = detectPlatform();
	} catch (err) {
		console.error(
			err instanceof Error ? err.message : "Unsupported platform",
		);
		process.exit(1);
	}
	console.log(`Platform: ${platform}`);

	// Check for Windows early
	if (platform === "windows") {
		console.error(
			"\nWindows support coming soon. Please use WSL for now.",
		);
		process.exit(1);
	}

	// 2. Check if config already exists
	const configFile = Bun.file(CONFIG_PATH);
	if (await configFile.exists()) {
		const existing = await configFile.json();
		if (existing.api_key) {
			console.log(
				`\nExisting config found at ${CONFIG_PATH}`,
			);
			console.log(
				"To re-initialize, delete the config file first:",
			);
			console.log(`  rm ${CONFIG_PATH}`);
			console.log("Then run agentmon init again.");
			return;
		}
	}

	// 3. Authenticate
	let apiKey: string;

	if (options.noBrowser) {
		apiKey = await deviceCodeFlow();
	} else {
		try {
			apiKey = await browserAuthFlow();
		} catch (err) {
			console.log(
				"\nBrowser auth failed. Falling back to device code flow...\n",
			);
			apiKey = await deviceCodeFlow();
		}
	}

	// 4. Save config
	await ensureConfigDir();

	const config = {
		api_key: apiKey,
		endpoint: "https://agentmon.dev/api/ingest",
		interval_ms: 300_000,
		claude_dir: join(homedir(), ".claude", "projects"),
	};

	await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));
	await chmod(CONFIG_PATH, 0o600);
	console.log(`\nConfig saved to ${CONFIG_PATH}`);

	// 5. Register OS daemon
	console.log("\nRegistering background daemon...");

	try {
		const daemonManager = await getDaemonManager();
		const binaryPath = resolveBinaryPath();

		await daemonManager.register(binaryPath);
		console.log("Daemon registered successfully.");
	} catch (err) {
		console.error(
			`Failed to register daemon: ${err instanceof Error ? err.message : String(err)}`,
		);
		console.log(
			'You can start agentmon manually with: agentmon start',
		);
		return;
	}

	// 6. Health check
	console.log("");
	await healthCheck();
}

async function browserAuthFlow(): Promise<string> {
	const state = randomBytes(16).toString("hex");

	// Start temporary HTTP server on random port
	return new Promise<string>((resolve, reject) => {
		const timeout = setTimeout(() => {
			server.stop();
			reject(
				new Error(
					"Authentication timed out. No callback received within 2 minutes.",
				),
			);
		}, CALLBACK_TIMEOUT_MS);

		const server = Bun.serve({
			port: 0, // Random available port
			fetch(req) {
				const url = new URL(req.url);

				if (url.pathname !== "/callback") {
					return new Response("Not found", { status: 404 });
				}

				const receivedState = url.searchParams.get("state");
				const receivedKey = url.searchParams.get("api_key");
				const error = url.searchParams.get("error");

				if (error) {
					clearTimeout(timeout);
					server.stop();
					reject(new Error(`Auth error: ${error}`));
					return new Response(
						htmlPage(
							"Authentication Failed",
							"Something went wrong. Please try again.",
						),
						{ headers: { "Content-Type": "text/html" } },
					);
				}

				if (receivedState !== state) {
					return new Response(
						htmlPage(
							"Invalid Request",
							"State mismatch - possible CSRF attack. Please try again.",
						),
						{
							status: 400,
							headers: { "Content-Type": "text/html" },
						},
					);
				}

				if (!receivedKey || !receivedKey.startsWith("am_")) {
					clearTimeout(timeout);
					server.stop();
					reject(new Error("Invalid API key received"));
					return new Response(
						htmlPage(
							"Invalid API Key",
							"Received an invalid API key. Please try again.",
						),
						{
							status: 400,
							headers: { "Content-Type": "text/html" },
						},
					);
				}

				clearTimeout(timeout);
				// Delay stopping to allow response to be sent
				setTimeout(() => server.stop(), 500);
				resolve(receivedKey);

				return new Response(
					htmlPage(
						"Success!",
						"agentmon is authenticated. You can close this tab.",
					),
					{ headers: { "Content-Type": "text/html" } },
				);
			},
		});

		const port = server.port;
		const authUrl = `${AUTH_BASE_URL}/cli?port=${port}&state=${state}`;

		console.log("Opening browser for GitHub authentication...");
		console.log(`Auth URL: ${authUrl}\n`);

		openBrowser(authUrl).catch(() => {
			clearTimeout(timeout);
			server.stop();
			reject(new Error("Failed to open browser"));
		});

		console.log("Waiting for authentication callback...");
	});
}

async function deviceCodeFlow(): Promise<string> {
	// Generate a short device code
	const deviceCode = randomBytes(3)
		.toString("hex")
		.toUpperCase()
		.match(/.{4}/g)!
		.join("-"); // e.g., "A1B2-C3D4-E5F6"

	console.log("Device code authentication:");
	console.log("");
	console.log(
		`  1. Visit: ${AUTH_BASE_URL}/device`,
	);
	console.log(`  2. Enter code: ${deviceCode}`);
	console.log("");
	console.log(
		"Waiting for authentication... (this will be implemented when /auth/device is available)",
	);
	console.log("");

	// TODO: Poll the server for API key once /auth/device endpoint exists
	// For now, prompt for manual API key entry
	console.log(
		"For now, please create an API key at https://agentmon.dev/dashboard/settings",
	);
	console.log("and enter it below:\n");

	const apiKey = await promptInput("API key (am_...): ");

	if (!apiKey || !apiKey.startsWith("am_")) {
		console.error("Invalid API key. Must start with 'am_'.");
		process.exit(1);
	}

	return apiKey;
}

async function promptInput(prompt: string): Promise<string> {
	process.stdout.write(prompt);

	const reader = Bun.stdin.stream().getReader();
	const { value } = await reader.read();
	reader.releaseLock();

	if (!value) {
		return "";
	}

	return new TextDecoder().decode(value).trim();
}

function resolveBinaryPath(): string {
	// If running from a compiled binary, use that path
	// Otherwise, construct the bun run command
	const argv0 = process.argv[0];

	// Check if we're running as a compiled Bun binary
	if (
		!argv0.includes("bun") &&
		!argv0.includes("node") &&
		!argv0.includes("tsx")
	) {
		return argv0;
	}

	// Fallback: use the agentmon command if it's in PATH
	// Otherwise use the full bun run path
	const agentmonInPath = findInPath("agentmon");
	if (agentmonInPath) {
		return agentmonInPath;
	}

	// Last resort: bun run with the source file
	const scriptPath = process.argv[1];
	return `${argv0} ${scriptPath}`;
}

function findInPath(name: string): string | null {
	const pathDirs = (process.env.PATH ?? "").split(":");
	for (const dir of pathDirs) {
		const fullPath = join(dir, name);
		const file = Bun.file(fullPath);
		// Synchronous check not available, so we skip this
		// and rely on the compiled binary detection above
	}
	return null;
}

async function openBrowser(url: string): Promise<void> {
	const platform = detectPlatform();

	let command: string;
	switch (platform) {
		case "macos":
			command = "open";
			break;
		case "linux":
			command = "xdg-open";
			break;
		default:
			throw new Error(`Cannot open browser on ${platform}`);
	}

	const proc = Bun.spawn([command, url], {
		stdout: "ignore",
		stderr: "ignore",
	});

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error(`Failed to open browser (${command} exited with ${exitCode})`);
	}
}

async function healthCheck(): Promise<void> {
	// Give the daemon a moment to start
	await Bun.sleep(1000);

	const { PID_PATH } = await import("../config.js");
	const pidFile = Bun.file(PID_PATH);

	if (await pidFile.exists()) {
		const pidStr = await pidFile.text();
		const pid = parseInt(pidStr.trim(), 10);
		if (!Number.isNaN(pid)) {
			try {
				process.kill(pid, 0);
				console.log(
					`\u2713 agentmon is running (PID ${pid})`,
				);
				return;
			} catch {
				// Process not found
			}
		}
	}

	// Daemon may not have started yet via launchd/systemd
	console.log(
		"Daemon is registered but may still be starting.",
	);
	console.log(
		'Check status with: agentmon status',
	);
}

function htmlPage(title: string, message: string): string {
	return `<!DOCTYPE html>
<html>
<head>
<title>agentmon - ${title}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex; justify-content: center; align-items: center;
    min-height: 100vh; margin: 0;
    background: #faf6ef; color: #2d1f1a;
  }
  .card {
    text-align: center; padding: 3rem;
    border-radius: 12px; background: white;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    max-width: 400px;
  }
  h1 { margin: 0 0 1rem; font-size: 1.5rem; }
  p { color: #666; }
</style>
</head>
<body>
<div class="card">
  <h1>${title}</h1>
  <p>${message}</p>
</div>
</body>
</html>`;
}
