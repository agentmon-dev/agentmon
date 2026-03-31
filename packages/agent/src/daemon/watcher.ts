import { watch, type FSWatcher } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * Track read positions for each file so we only process new lines.
 */
const filePositions = new Map<string, number>();

/**
 * Read new lines appended to a file since our last read position.
 */
async function readNewLines(filePath: string): Promise<string[]> {
	const file = Bun.file(filePath);
	if (!(await file.exists())) return [];

	const fileSize = file.size;
	const lastPos = filePositions.get(filePath) ?? 0;

	if (fileSize <= lastPos) return [];

	// Read only the new bytes
	const slice = file.slice(lastPos, fileSize);
	const text = await slice.text();

	filePositions.set(filePath, fileSize);

	return text.split("\n").filter((line) => line.trim().length > 0);
}

/**
 * Recursively find all .jsonl files in a directory.
 */
async function findJSONLFiles(dir: string): Promise<string[]> {
	const results: string[] = [];

	let entries: Awaited<ReturnType<typeof readdir>>;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return results;
	}

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			const nested = await findJSONLFiles(fullPath);
			results.push(...nested);
		} else if (entry.name.endsWith(".jsonl")) {
			results.push(fullPath);
		}
	}

	return results;
}

export interface WatcherHandle {
	/** Stop watching all directories */
	close(): void;
}

/**
 * Watch directories for JSONL file changes.
 *
 * Uses fs.watch (Bun native, uses kqueue/inotify under the hood)
 * with recursive option where supported.
 *
 * @param dirs - Directories to watch
 * @param onChange - Called with new lines, agent name, and project name
 * @param getProjectName - Extract project name from file path
 * @param agentName - Agent identifier
 */
export function watchJSONLFiles(
	dirs: string[],
	onChange: (
		lines: string[],
		agent: string,
		project: string,
	) => void,
	getProjectName: (filePath: string) => string,
	agentName: string,
): WatcherHandle {
	const watchers: FSWatcher[] = [];

	// Debounce map to avoid processing the same file multiple times
	// in rapid succession
	const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

	for (const dir of dirs) {
		// Verify directory exists before watching
		stat(dir)
			.then((s) => {
				if (!s.isDirectory()) return;

				const watcher = watch(
					dir,
					{ recursive: true },
					(eventType, filename) => {
						if (!filename || !filename.endsWith(".jsonl")) return;

						const filePath = join(dir, filename);

						// Debounce: wait 200ms after last change before reading
						const existing = debounceTimers.get(filePath);
						if (existing) clearTimeout(existing);

						debounceTimers.set(
							filePath,
							setTimeout(async () => {
								debounceTimers.delete(filePath);
								try {
									const newLines = await readNewLines(filePath);
									if (newLines.length > 0) {
										const project = getProjectName(filePath);
										onChange(newLines, agentName, project);
									}
								} catch (err) {
									console.error(
										`[watcher] Error reading ${filePath}:`,
										err,
									);
								}
							}, 200),
						);
					},
				);

				watchers.push(watcher);
			})
			.catch(() => {
				console.warn(`[watcher] Directory does not exist: ${dir}`);
			});

		// Also do an initial scan to set file positions
		// (so we don't re-process existing content on first start)
		findJSONLFiles(dir)
			.then(async (files) => {
				for (const filePath of files) {
					const file = Bun.file(filePath);
					if (await file.exists()) {
						filePositions.set(filePath, file.size);
					}
				}
			})
			.catch(() => {
				// Ignore - directory may not exist yet
			});
	}

	return {
		close() {
			for (const w of watchers) {
				w.close();
			}
			for (const timer of debounceTimers.values()) {
				clearTimeout(timer);
			}
			debounceTimers.clear();
		},
	};
}
