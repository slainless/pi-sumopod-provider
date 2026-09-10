import { getAgentDir, type ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Type } from "typebox";
import { Parse } from "typebox/schema";
import type { Catalog } from "../core/catalog";
import { SumoPod } from "../core/schema";
import packageJson from "../package.json" with { type: "json" };

export class CatalogConfig {
	#catalogUrl = CatalogConfig.DEFAULT_CATALOG_URL;
	#catalog: ProviderModelConfig[] = [];

	constructor() {}

	/**
	 * Load local configuration or start a new configuration
	 */
	async init() {
		try {
			await this.loadConfiguration();
		} catch (e) {
			if (!util.isNodeError(e, "ENOENT")) throw e;
			await this.switchRemoteUrl(this.#catalogUrl);
		}
	}

	catalog() {
		return this.#catalog;
	}

	catalogUrl() {
		return this.#catalogUrl;
	}

	/**
	 * Refresh and sync catalog to the remote source
	 */
	async refresh() {
		await this.switchRemoteUrl(this.#catalogUrl);
	}

	/**
	 * Change catalog url and load it immediately.
	 * This will apply to the configuration, not only the session.
	 */
	async setCatalogUrl(url: URL) {
		await this.switchRemoteUrl(url);
	}

	private async loadConfiguration() {
		const rawConfig = await readFile(this.configPath(), { encoding: "utf8" });
		const config = Parse(CatalogConfig.Config, JSON.parse(rawConfig));

		this.#catalogUrl = new URL(config.catalogUrl);
		this.#catalog = config.catalog.models.map(this.sanitizeModel);
	}

	private async switchRemoteUrl(url: URL) {
		const catalog = await this.loadRemote(this.#catalogUrl);
		await writeFile(
			this.configPath(),
			JSON.stringify({ catalog, catalogUrl: url.href } satisfies CatalogConfig.Config),
		);

		this.#catalog = catalog.models.map(this.sanitizeModel);
		this.#catalogUrl = url;
	}

	private async loadRemote(url: URL) {
		const response = await fetch(url, { headers: { "Accept": "application/json" } });
		if (!response.ok) {
			const error = new Error(`Failed to fetch: ${url}`);
			// @ts-expect-error ...
			error.response = response;
		}

		const body = await response.json();
		const catalog = Parse(CatalogConfig.Catalog, body);

		return catalog;
	}

	private configPath() {
		const dir = getAgentDir();
		return join(dir, "sumopod", "catalog-data.json");
	}

	private sanitizeModel(model: Catalog.ModelConfig) {
		const { annotation, sumopod, ...config } = model;
		return config as ProviderModelConfig;
	}
}

export namespace CatalogConfig {
	export const DEFAULT_CATALOG_URL = new URL("releases/latest/download/catalog.json", packageJson.homepage + "/");

	export const Catalog = Type.Object({
		models: Type.Array(Type.Unsafe<Catalog.ModelConfig>(Type.Object({
			sumopod: Type.Object({
				model: SumoPod.Model,
				discount: Type.Optional(SumoPod.Discount),
			}),
		}, { additionalProperties: true }))),
		unmatched: Type.Array(SumoPod.Model),
		nonChat: Type.Array(SumoPod.Model),
	});

	export const Config = Type.Object({
		catalog: Catalog,
		catalogUrl: Type.String(),
	});

	export type Config = Type.Static<typeof Config>;
}

namespace util {
	export function isNodeError(error: unknown, code: string): boolean {
		return (
			error instanceof Error
			&& "code" in error
			&& error.code === code
		);
	}
}
