import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import type { DaemonManager } from "./platform.js";

const SERVICE_NAME = "agentmon";
const UNIT_DIR = join(homedir(), ".config", "systemd", "user");
const UNIT_PATH = join(UNIT_DIR, `${SERVICE_NAME}.service`);
const LOG_DIR = join(homedir(), ".config", "agentmon", "logs");

function buildUnitFile(binaryPath: string): string {
	return `[Unit]
Description=agentmon - AI coding agent token usage monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${binaryPath} start
Restart=on-failure
RestartSec=10
StandardOutput=append:${join(LOG_DIR, "agentmon.out.log")}
StandardError=append:${join(LOG_DIR, "agentmon.err.log")}

[Install]
WantedBy=default.target`;
}

export class SystemdManager implements DaemonManager {
	async register(binaryPath: string): Promise<void> {
		// Ensure directories exist
		await mkdir(UNIT_DIR, { recursive: true });
		await mkdir(LOG_DIR, { recursive: true });

		// Stop existing service if running (ignore errors)
		if (await this.isRegistered()) {
			try {
				await this.runSystemctl(["stop", SERVICE_NAME]);
			} catch {
				// Ignore - may not be running
			}
		}

		// Write unit file
		const unit = buildUnitFile(binaryPath);
		await Bun.write(UNIT_PATH, unit);

		// Reload systemd and enable + start the service
		await this.runSystemctl(["daemon-reload"]);
		await this.runSystemctl(["enable", SERVICE_NAME]);
		await this.runSystemctl(["start", SERVICE_NAME]);
	}

	async unregister(): Promise<void> {
		if (!(await this.isRegistered())) {
			return;
		}

		try {
			await this.runSystemctl(["stop", SERVICE_NAME]);
		} catch {
			// Ignore
		}

		try {
			await this.runSystemctl(["disable", SERVICE_NAME]);
		} catch {
			// Ignore
		}

		// Remove unit file
		const { unlink } = await import("node:fs/promises");
		try {
			await unlink(UNIT_PATH);
		} catch {
			// Ignore
		}

		try {
			await this.runSystemctl(["daemon-reload"]);
		} catch {
			// Ignore
		}
	}

	async isRegistered(): Promise<boolean> {
		const file = Bun.file(UNIT_PATH);
		return file.exists();
	}

	private async runSystemctl(args: string[]): Promise<string> {
		const proc = Bun.spawn(["systemctl", "--user", ...args], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();

		if (exitCode !== 0) {
			throw new Error(
				`systemctl --user ${args.join(" ")} failed (exit ${exitCode}): ${stderr || stdout}`,
			);
		}

		return stdout;
	}
}
