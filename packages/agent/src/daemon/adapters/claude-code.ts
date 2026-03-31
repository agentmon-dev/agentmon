import { homedir } from "node:os";
import { join, sep } from "node:path";
import type { AgentAdapter } from "./base.js";

/**
 * Claude Code adapter.
 *
 * JSONL location: ~/.claude/projects/{project-name}/{session}.jsonl
 * Each line is a JSON object with a `usage` field when it's an API response.
 */
export class ClaudeCodeAdapter implements AgentAdapter {
	readonly agentName = "claude-code";

	private readonly claudeDir: string;

	constructor(claudeDir?: string) {
		this.claudeDir = claudeDir ?? join(homedir(), ".claude", "projects");
	}

	getWatchDirs(): string[] {
		return [this.claudeDir];
	}

	getProjectName(filePath: string): string {
		// Path pattern: {claudeDir}/{project-name}/.../*.jsonl
		const relative = filePath.slice(this.claudeDir.length + 1);
		const firstSegment = relative.split(sep)[0];
		return firstSegment ?? "unknown";
	}

	parseLines(
		lines: string[],
	): Array<{
		requestId: string;
		model: string;
		inputTokens: number;
		outputTokens: number;
		cacheReadTokens: number;
		cacheCreationTokens: number;
		timestamp: string;
	}> {
		const results: Array<{
			requestId: string;
			model: string;
			inputTokens: number;
			outputTokens: number;
			cacheReadTokens: number;
			cacheCreationTokens: number;
			timestamp: string;
		}> = [];

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;

			let parsed: Record<string, unknown>;
			try {
				parsed = JSON.parse(trimmed);
			} catch {
				// Skip malformed lines
				continue;
			}

			// Claude Code JSONL lines with usage data have a `usage` object
			const usage = parsed.usage as Record<string, number> | undefined;
			if (!usage) continue;

			const inputTokens = usage.input_tokens ?? 0;
			const outputTokens = usage.output_tokens ?? 0;

			// Filter streaming placeholders (input_tokens 0 or 1)
			if (inputTokens <= 1 && outputTokens === 0) continue;

			const requestId =
				(parsed.requestId as string) ??
				(parsed.request_id as string) ??
				"";

			if (!requestId) {
				// Without a requestId we cannot deduplicate - warn and include anyway
				console.warn(
					"[claude-code] JSONL line missing requestId, schema may have changed",
				);
			}

			const model = (parsed.model as string) ?? "unknown";
			const timestamp =
				(parsed.timestamp as string) ??
				(parsed.createdAt as string) ??
				new Date().toISOString();

			results.push({
				requestId,
				model,
				inputTokens,
				outputTokens,
				cacheReadTokens: usage.cache_read_input_tokens ?? 0,
				cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
				timestamp,
			});
		}

		return results;
	}
}
