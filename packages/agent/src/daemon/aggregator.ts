import { estimateCost } from "@agentmon/shared";
import type { ParsedRecord } from "./parser.js";

export interface AggregatedBucket {
	recordedAt: string;
	agent: string;
	project: string;
	model: string;
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens: number;
	cacheCreationTokens: number;
	estimatedCostUsd: number;
}

/**
 * Round a timestamp down to the nearest 5-minute boundary.
 */
function toBucketKey(isoTimestamp: string): string {
	const date = new Date(isoTimestamp);
	const minutes = date.getMinutes();
	date.setMinutes(minutes - (minutes % 5), 0, 0);
	return date.toISOString();
}

/**
 * Group parsed records into 5-minute buckets, summing tokens
 * per bucket per model. Calculate estimated cost using shared pricing.
 */
export function aggregate(
	records: ParsedRecord[],
	agent: string,
	project: string,
): AggregatedBucket[] {
	// Key: `${bucketTime}|${model}`
	const buckets = new Map<
		string,
		{
			recordedAt: string;
			model: string;
			inputTokens: number;
			outputTokens: number;
			cacheReadTokens: number;
			cacheCreationTokens: number;
		}
	>();

	for (const record of records) {
		const bucketTime = toBucketKey(record.timestamp);
		const key = `${bucketTime}|${record.model}`;

		const existing = buckets.get(key);
		if (existing) {
			existing.inputTokens += record.inputTokens;
			existing.outputTokens += record.outputTokens;
			existing.cacheReadTokens += record.cacheReadTokens;
			existing.cacheCreationTokens += record.cacheCreationTokens;
		} else {
			buckets.set(key, {
				recordedAt: bucketTime,
				model: record.model,
				inputTokens: record.inputTokens,
				outputTokens: record.outputTokens,
				cacheReadTokens: record.cacheReadTokens,
				cacheCreationTokens: record.cacheCreationTokens,
			});
		}
	}

	const results: AggregatedBucket[] = [];

	for (const bucket of buckets.values()) {
		const cost = estimateCost(bucket.model, {
			input: bucket.inputTokens,
			output: bucket.outputTokens,
			cacheRead: bucket.cacheReadTokens,
			cacheCreation: bucket.cacheCreationTokens,
		});

		results.push({
			recordedAt: bucket.recordedAt,
			agent,
			project,
			model: bucket.model,
			inputTokens: bucket.inputTokens,
			outputTokens: bucket.outputTokens,
			cacheReadTokens: bucket.cacheReadTokens,
			cacheCreationTokens: bucket.cacheCreationTokens,
			estimatedCostUsd: Math.round(cost * 1_000_000) / 1_000_000,
		});
	}

	return results.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}
