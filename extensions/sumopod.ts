import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { setSumopodApiKey } from "./api-key";
import { SUMOPOD_MODELS } from "./models";

/**
 * SumoPod AI provider registration for Pi coding agent.
 *
 * SumoPod (ai.sumopod.com) provides OpenAI-compatible access to frontier AI models.
 *
 * Setup:
 *   1. Get API key: https://ai.sumopod.com → AI tab → API Keys
 *   2. Set API key: /sumopod-key <your-api-key>
 *   3. Select "sumopod" provider in Pi
 */
export default function(pi: ExtensionAPI): void {
	// Register /sumopod-key command for easy API key setup
	pi.registerCommand("sumopod-key", {
		description: "Set your SumoPod API key",
		handler: async (args: string, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("This command requires interactive mode", "error");
				return;
			}

			// If no args provided, prompt for the key
			let apiKey = args.trim();
			if (!apiKey) {
				apiKey = (await ctx.ui.input(
					"Enter your SumoPod API Key",
					"sk-...",
				)) ?? "";
			}

			if (!apiKey) {
				ctx.ui.notify("No API key provided", "warning");
				return;
			}

			setSumopodApiKey(apiKey);

			// Re-register with literal key so current session works immediately
			pi.registerProvider("sumopod", {
				name: "SumoPod",
				baseUrl: "https://ai.sumopod.com/v1",
				apiKey,
				authHeader: true,
				api: "openai-completions",
				models: SUMOPOD_MODELS,
			});

			ctx.ui.notify("SumoPod API key saved and active!", "info");
		},
	});

	// Register SumoPod provider
	pi.registerProvider("sumopod", {
		name: "SumoPod",
		baseUrl: "https://ai.sumopod.com/v1",
		apiKey: "$SUMOPOD_API_KEY",
		authHeader: true,
		api: "openai-completions",
		models: SUMOPOD_MODELS,
	});
}
