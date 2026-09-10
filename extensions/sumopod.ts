import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { CatalogConfig } from "./catalog-config";
import { APIKeyConfig } from "./key-config";

export default async function(pi: ExtensionAPI) {
	const config = new CatalogConfig();
	const apiKey = new APIKeyConfig();

	await config.init();

	// Register /sumopod-key command for easy API key setup
	pi.registerCommand("sumopod-key", {
		description: "Set your SumoPod API key",
		handler: async (args, ctx) => {
			const key = await input(args, ctx, {
				prompt: "Enter your SumoPod API Key",
				placeholder: "sk-...",
				warning: "No API key provided",
			});
			if (!key) return;

			await apiKey.setKey(key);

			refreshProvider();

			ctx.ui.notify("SumoPod API key saved and provider reloaded!", "info");
		},
	});

	pi.registerCommand("/sumopod-catalog-url", {
		description: `Set Sumopod catalog url (default: ${CatalogConfig.DEFAULT_CATALOG_URL.href}`,
		handler: async (args, ctx) => {
			const key = await input(args, ctx, {
				prompt: "Enter the catalog url",
				placeholder: `default: ${CatalogConfig.DEFAULT_CATALOG_URL.href}`,
				warning: "No url provided",
			});
			if (!key) return;

			const url = new URL(key);
			await config.setCatalogUrl(url);

			refreshProvider();
		},
	});

	pi.registerCommand("/sumopod-catalog-refresh", {
		description: `Refresh Sumopod catalog`,
		handler: async (args, ctx) => {
			await config.refresh();
			refreshProvider();
		},
	});

	refreshProvider();

	function refreshProvider() {
		const key = apiKey.key() ?? "$SUMOPOD_API_KEY";

		// Register SumoPod provider
		pi.registerProvider("sumopod", {
			name: "SumoPod",
			baseUrl: "https://ai.sumopod.com/v1",
			apiKey: key,
			authHeader: true,
			api: "openai-completions",
			models: config.catalog(),
		});
	}

	async function input(args: string, ctx: ExtensionCommandContext, tui: {
		prompt: string;
		placeholder?: string;
		warning?: string;
	}) {
		// If no args provided, prompt for the key
		let input = args.trim();
		if (!input) {
			if (!ctx.hasUI) {
				ctx.ui.notify("This command requires interactive mode if argument is not provided", "error");
				return;
			}

			input = ((await ctx.ui.input(
				tui.prompt,
				tui.placeholder || "...",
			)) ?? "")?.trim();
		}

		if (!input) {
			ctx.ui.notify(tui.warning || "No argument provided", "warning");
			return;
		}

		return input;
	}
}
