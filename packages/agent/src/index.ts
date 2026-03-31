#!/usr/bin/env bun

import { writeFile, readFile, unlink } from "node:fs/promises";
import {
	loadConfig,
	PID_PATH,
	ensureConfigDir,
} from "./config.js";
import { ClaudeCodeAdapter } from "./daemon/adapters/claude-code.js";
import { aggregate, type AggregatedBucket } from "./daemon/aggregator.js";
import { parseJSONLLines, type ParsedRecord } from "./daemon/parser.js";
import { sendToServer, getLastSyncTime } from "./daemon/sender.js";
import { watchJSONLFiles } from "./daemon/watcher.js";
import { runInit } from "./commands/init.js";

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
	case "init":
		await runInit({
			noBrowser: args.includes("--no-browser"),
		});
		break;
	case "start":
		await runStart();
		break;
	case "stop":
		await runStop();
		break;
	case "status":
		await runStatus();
		break;
	default:
		console.log(`agentmon - AI coding agent token usage monitor

Usage:
  agentmon init      Set up agentmon (OAuth + API key + daemon)
  agentmon start     Start the background daemon
  agentmon stop      Stop the daemon
  agentmon status    Check daemon status and last sync
`);
}

async function runStart(): Promise<void> {
	let config;
	try {
		config = await loadConfig();
	} catch (err) {
		console.error(
			err instanceof Error ? err.message : "Failed to load config",
		);
		process.exit(1);
	}

	// Check if already running
	const existingPid = await readPid();
	if (existingPid !== null) {
		if (isProcessRunning(existingPid)) {
			console.error(
				`agentmon is already running (PID ${existingPid}). Use "agentmon stop" first.`,
			);
			process.exit(1);
		}
		// Stale PID file - clean up
		await removePid();
	}

	// Write PID file
	await ensureConfigDir();
	await writeFile(PID_PATH, String(process.pid));

	console.log(`agentmon daemon started (PID ${process.pid})`);
	console.log(`Watching: ${config.claudeDir}`);
	console.log(`Interval: ${config.intervalMs / 1000}s`);
	console.log(`Endpoint: ${config.endpoint}`);

	// Set up adapter
	const adapter = new ClaudeCodeAdapter(config.claudeDir);

	// Pending records buffer - accumulate between send intervals
	let pendingRecords: Array<{
		records: ParsedRecord[];
		agent: string;
		project: string;
	}> = [];

	// Start file watcher
	const watcher = watchJSONLFiles(
		adapter.getWatchDirs(),
		(lines, agent, project) => {
			const rawParsed = adapter.parseLines(lines);
			const deduped = parseJSONLLines(rawParsed);
			if (deduped.length > 0) {
				pendingRecords.push({ records: deduped, agent, project });
			}
		},
		(filePath) => adapter.getProjectName(filePath),
		adapter.agentName,
	);

	// Periodic send loop
	const intervalId = setInterval(async () => {
		if (pendingRecords.length === 0) {
			// Still try to send - there might be buffered records
			const result = await sendToServer([], config);
			if (result.ok && (result.inserted ?? 0) > 0) {
				console.log(
					`[sync] Sent ${result.inserted} buffered records`,
				);
			}
			return;
		}

		// Aggregate all pending records
		const allBuckets: AggregatedBucket[] = [];
		for (const { records, agent, project } of pendingRecords) {
			const buckets = aggregate(records, agent, project);
			allBuckets.push(...buckets);
		}
		pendingRecords = [];

		const result = await sendToServer(allBuckets, config);
		if (result.ok) {
			console.log(
				`[sync] Sent ${result.inserted} records`,
			);
		} else if (result.revoked) {
			console.error(
				"[sync] API key revoked. Stopping daemon.",
			);
			cleanup();
			process.exit(1);
		} else {
			console.warn(
				`[sync] Send failed: ${result.error}`,
			);
		}
	}, config.intervalMs);

	// Graceful shutdown
	function cleanup(): void {
		console.log("\nagentmon daemon stopping...");
		clearInterval(intervalId);
		watcher.close();
		removePid().catch(() => {});
	}

	process.on("SIGTERM", () => {
		cleanup();
		process.exit(0);
	});

	process.on("SIGINT", () => {
		cleanup();
		process.exit(0);
	});
}

async function runStop(): Promise<void> {
	const pid = await readPid();
	if (pid === null) {
		console.log("agentmon is not running (no PID file found).");
		return;
	}

	if (!isProcessRunning(pid)) {
		console.log(`agentmon is not running (stale PID ${pid}). Cleaning up.`);
		await removePid();
		return;
	}

	try {
		process.kill(pid, "SIGTERM");
		console.log(`agentmon daemon stopped (PID ${pid}).`);
	} catch {
		console.error(`Failed to stop agentmon (PID ${pid}).`);
	}

	await removePid();
}

async function runStatus(): Promise<void> {
	const pid = await readPid();
	const lastSync = await getLastSyncTime();

	if (pid === null) {
		console.log("Status: not running");
	} else if (isProcessRunning(pid)) {
		console.log(`Status: running (PID ${pid})`);
	} else {
		console.log(`Status: not running (stale PID ${pid})`);
	}

	if (lastSync) {
		const ago = formatTimeAgo(new Date(lastSync));
		console.log(`Last sync: ${lastSync} (${ago})`);
	} else {
		console.log("Last sync: never");
	}
}

// --- Helpers ---

async function readPid(): Promise<number | null> {
	try {
		const content = await readFile(PID_PATH, "utf-8");
		const pid = parseInt(content.trim(), 10);
		return Number.isNaN(pid) ? null : pid;
	} catch {
		return null;
	}
}

async function removePid(): Promise<void> {
	try {
		await unlink(PID_PATH);
	} catch {
		// Ignore
	}
}

function isProcessRunning(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function formatTimeAgo(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
