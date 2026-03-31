export interface ModelPricing {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
}

/** USD per 1M tokens */
export const PRICING: Record<string, ModelPricing> = {
	"claude-opus-4-6": { input: 5.0, output: 25.0, cacheRead: 0.5, cacheWrite: 6.25 },
	"claude-sonnet-4-6": { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
	"claude-haiku-4-5": { input: 0.8, output: 4.0, cacheRead: 0.08, cacheWrite: 1.0 },
};

export function estimateCost(
	model: string,
	tokens: {
		input: number;
		output: number;
		cacheRead: number;
		cacheCreation: number;
	},
): number {
	const pricing = PRICING[model];
	if (!pricing) return 0;

	return (
		(tokens.input * pricing.input +
			tokens.output * pricing.output +
			tokens.cacheRead * pricing.cacheRead +
			tokens.cacheCreation * pricing.cacheWrite) /
		1_000_000
	);
}
