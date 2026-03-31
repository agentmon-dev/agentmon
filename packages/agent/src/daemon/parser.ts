export interface ParsedRecord {
	requestId: string;
	model: string;
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens: number;
	cacheCreationTokens: number;
	timestamp: string;
}

/**
 * Parse JSONL lines using the given adapter, then deduplicate.
 *
 * Deduplication: Claude Code emits 2-10 duplicate lines per requestId
 * (51-55% of all lines). We keep the entry with the latest timestamp
 * for each requestId, as later entries have more complete token counts.
 */
export function parseJSONLLines(
	rawRecords: ParsedRecord[],
): ParsedRecord[] {
	// Filter out streaming placeholders (already handled by adapter,
	// but double-check here)
	const valid = rawRecords.filter(
		(r) => !(r.inputTokens <= 1 && r.outputTokens === 0),
	);

	// Deduplicate by requestId - keep the latest timestamp entry
	const byRequestId = new Map<string, ParsedRecord>();

	for (const record of valid) {
		if (!record.requestId) {
			// No requestId means we can't deduplicate - include it as-is
			// Use a unique key so it doesn't overwrite others
			byRequestId.set(`_no_id_${byRequestId.size}`, record);
			continue;
		}

		const existing = byRequestId.get(record.requestId);
		if (!existing || record.timestamp > existing.timestamp) {
			byRequestId.set(record.requestId, record);
		}
	}

	return Array.from(byRequestId.values());
}
