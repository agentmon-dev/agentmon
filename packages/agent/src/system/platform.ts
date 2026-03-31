import { platform } from "node:os";

export interface DaemonManager {
	register(binaryPath: string): Promise<void>;
	unregister(): Promise<void>;
	isRegistered(): Promise<boolean>;
}

export type Platform = "macos" | "linux" | "windows";

export function detectPlatform(): Platform {
	const p = platform();
	switch (p) {
		case "darwin":
			return "macos";
		case "linux":
			return "linux";
		case "win32":
			return "windows";
		default:
			throw new Error(`Unsupported platform: ${p}`);
	}
}

export async function getDaemonManager(): Promise<DaemonManager> {
	const p = detectPlatform();
	switch (p) {
		case "macos": {
			const { LaunchdManager } = await import("./launchd.js");
			return new LaunchdManager();
		}
		case "linux": {
			const { SystemdManager } = await import("./systemd.js");
			return new SystemdManager();
		}
		case "windows":
			throw new Error(
				"Windows support coming soon. Please use WSL for now.",
			);
	}
}
