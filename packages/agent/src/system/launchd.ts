import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import type { DaemonManager } from "./platform.js";

const LABEL = "dev.agentmon";
const PLIST_DIR = join(homedir(), "Library", "LaunchAgents");
const PLIST_PATH = join(PLIST_DIR, `${LABEL}.plist`);
const LOG_DIR = join(homedir(), ".config", "agentmon", "logs");

function buildPlist(binaryPath: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>${LABEL}</string>
	<key>ProgramArguments</key>
	<array>
		<string>${binaryPath}</string>
		<string>start</string>
	</array>
	<key>KeepAlive</key>
	<true/>
	<key>RunAtLoad</key>
	<true/>
	<key>StandardOutPath</key>
	<string>${join(LOG_DIR, "agentmon.out.log")}</string>
	<key>StandardErrorPath</key>
	<string>${join(LOG_DIR, "agentmon.err.log")}</string>
	<key>ProcessType</key>
	<string>Background</string>
	<key>ThrottleInterval</key>
	<integer>10</integer>
</dict>
</plist>`;
}

export class LaunchdManager implements DaemonManager {
	async register(binaryPath: string): Promise<void> {
		// Ensure directories exist
		await mkdir(PLIST_DIR, { recursive: true });
		await mkdir(LOG_DIR, { recursive: true });

		// Unload existing service if present (ignore errors)
		if (await this.isRegistered()) {
			try {
				await this.runLaunchctl(["unload", PLIST_PATH]);
			} catch {
				// Ignore - may not be loaded
			}
		}

		// Write plist file
		const plist = buildPlist(binaryPath);
		await Bun.write(PLIST_PATH, plist);

		// Load the service
		await this.runLaunchctl(["load", PLIST_PATH]);
	}

	async unregister(): Promise<void> {
		if (!(await this.isRegistered())) {
			return;
		}

		try {
			await this.runLaunchctl(["unload", PLIST_PATH]);
		} catch {
			// Ignore
		}

		// Remove plist file
		const { unlink } = await import("node:fs/promises");
		try {
			await unlink(PLIST_PATH);
		} catch {
			// Ignore
		}
	}

	async isRegistered(): Promise<boolean> {
		const file = Bun.file(PLIST_PATH);
		return file.exists();
	}

	private async runLaunchctl(args: string[]): Promise<string> {
		const proc = Bun.spawn(["launchctl", ...args], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();

		if (exitCode !== 0) {
			throw new Error(
				`launchctl ${args.join(" ")} failed (exit ${exitCode}): ${stderr || stdout}`,
			);
		}

		return stdout;
	}
}
