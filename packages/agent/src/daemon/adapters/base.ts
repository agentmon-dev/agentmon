export interface AgentAdapter {
	/** Unique agent identifier sent to the server */
	readonly agentName: string;

	/** Directories to watch for JSONL files */
	getWatchDirs(): string[];

	/** Extract project name from a JSONL file path */
	getProjectName(filePath: string): string;

	/**
	 * Parse raw JSONL lines into a normalized form.
	 * Each adapter knows its agent's JSONL schema.
	 */
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
	}>;
}
