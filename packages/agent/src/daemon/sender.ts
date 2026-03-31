import { appendFile, readFile, writeFile } from "node:fs/promises";
import type { AgentConfig } from "../config.js";
import { BUFFER_PATH, LAST_SYNC_PATH, ensureConfigDir } from "../config.js";
import type { AggregatedBucket } from "./aggregator.js";

export interface SendResult {
	ok: boolean;
	inserted?: number;
	error?: string;
	/** True if key was revoked (401) */
	revoked?: boolean;
	/** True if rate limited (429) */
	rateLimited?: boolean;
}

/**
 * Load buffered records from the local buffer file.
 */
async function loadBuffer(): Promise<AggregatedBucket[]> {
	try {
		const content = await readFile(BUFFER_PATH, "utf-8");
		const lines = content.split("\n").filter((l) => l.trim());
		return lines.map((l) => JSON.parse(l) as AggregatedBucket);
	} catch {
		return [];
	}
}

/**
 * Append records to the local buffer file for later retry.
 */
async function appendToBuffer(buckets: AggregatedBucket[]): Promise<void> {
	await ensureConfigDir();
	const lines = buckets.map((b) => JSON.stringify(b)).join("\n") + "\n";
	await appendFile(BUFFER_PATH, lines);
}

/**
 * Clear the buffer file after successful send.
 */
async function clearBuffer(): Promise<void> {
	try {
		await writeFile(BUFFER_PATH, "");
	} catch {
		// Ignore if file doesn't exist
	}
}

/**
 * Record the last successful sync time.
 */
async function recordLastSync(): Promise<void> {
	await ensureConfigDir();
	await writeFile(LAST_SYNC_PATH, new Date().toISOString());
}

/**
 * Get the last successful sync time.
 */
export async function getLastSyncTime(): Promise<string | null> {
	try {
		const content = await readFile(LAST_SYNC_PATH, "utf-8");
		return content.trim() || null;
	} catch {
		return null;
	}
}

/**
 * Send aggregated buckets to the ingest endpoint.
 *
 * On failure, saves to local buffer. On success, also sends any
 * previously buffered records.
 *
 * Uses exponential backoff on repeated failures (max 5 retries per cycle).
 */
export async function sendToServer(
	buckets: AggregatedBucket[],
	config: AgentConfig,
): Promise<SendResult> {
	// Load any previously buffered records
	const buffered = await loadBuffer();
	const allRecords = [...buffered, ...buckets];

	if (allRecords.length === 0) {
		return { ok: true, inserted: 0 };
	}

	const payload = {
		records: allRecords.map((b) => ({
			recorded_at: b.recordedAt,
			agent: b.agent,
			project: b.project,
			model: b.model,
			input_tokens: b.inputTokens,
			output_tokens: b.outputTokens,
			cache_read_tokens: b.cacheReadTokens,
			cache_creation_tokens: b.cacheCreationTokens,
			estimated_cost_usd: b.estimatedCostUsd,
		})),
	};

	const maxRetries = 5;
	let lastError = "";

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		if (attempt > 0) {
			// Exponential backoff: 1s, 2s, 4s, 8s, 16s
			const delay = 1000 * 2 ** (attempt - 1);
			await Bun.sleep(delay);
		}

		try {
			const response = await fetch(config.endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${config.apiKey}`,
				},
				body: JSON.stringify(payload),
			});

			if (response.ok) {
				const body = (await response.json()) as {
					ok: boolean;
					inserted: number;
				};
				// Success - clear buffer and record sync time
				await clearBuffer();
				await recordLastSync();
				return { ok: true, inserted: body.inserted };
			}

			if (response.status === 401) {
				console.warn(
					"[sender] API key revoked or invalid. Run \"agentmon init\" to set up a new key.",
				);
				// Don't buffer on auth errors - the records will just pile up
				return { ok: false, error: "Unauthorized", revoked: true };
			}

			if (response.status === 429) {
				console.warn(
					`[sender] Rate limited (attempt ${attempt + 1}/${maxRetries}), backing off...`,
				);
				lastError = "Rate limited";
				// Continue to retry with backoff
				continue;
			}

			// Other server errors
			lastError = `HTTP ${response.status}: ${response.statusText}`;
			console.error(
				`[sender] Server error (attempt ${attempt + 1}/${maxRetries}): ${lastError}`,
			);
		} catch (err) {
			lastError = err instanceof Error ? err.message : String(err);
			console.error(
				`[sender] Network error (attempt ${attempt + 1}/${maxRetries}): ${lastError}`,
			);
		}
	}

	// All retries failed - buffer the new records (not the already-buffered ones)
	if (buckets.length > 0) {
		console.warn(
			`[sender] Buffering ${buckets.length} records for later retry.`,
		);
		await appendToBuffer(buckets);
	}

	return { ok: false, error: lastError };
}
