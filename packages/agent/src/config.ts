import { homedir } from "node:os";
import { join } from "node:path";

export interface AgentConfig {
	apiKey: string;
	endpoint: string;
	intervalMs: number;
	claudeDir: string;
}

const CONFIG_DIR = join(homedir(), ".config", "agentmon");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");
export const PID_PATH = join(CONFIG_DIR, "agentmon.pid");
export const BUFFER_PATH = join(CONFIG_DIR, "buffer.jsonl");
export const LAST_SYNC_PATH = join(CONFIG_DIR, "last-sync");

const DEFAULTS: Omit<AgentConfig, "apiKey"> = {
	endpoint: "https://agentmon.dev/api/ingest",
	intervalMs: 300_000,
	claudeDir: join(homedir(), ".claude", "projects"),
};

export async function loadConfig(): Promise<AgentConfig> {
	const file = Bun.file(CONFIG_PATH);
	if (!(await file.exists())) {
		throw new Error(
			`Config not found at ${CONFIG_PATH}. Run "agentmon init" first.`,
		);
	}

	const raw = await file.json();

	if (!raw.api_key && !raw.apiKey) {
		throw new Error("Config missing api_key. Run \"agentmon init\" to set up.");
	}

	return {
		apiKey: raw.api_key ?? raw.apiKey,
		endpoint: raw.endpoint ?? DEFAULTS.endpoint,
		intervalMs: raw.interval_ms ?? raw.intervalMs ?? DEFAULTS.intervalMs,
		claudeDir: raw.claude_dir ?? raw.claudeDir ?? DEFAULTS.claudeDir,
	};
}

export async function ensureConfigDir(): Promise<void> {
	const { mkdir } = await import("node:fs/promises");
	await mkdir(CONFIG_DIR, { recursive: true });
}
