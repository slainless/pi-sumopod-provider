import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import ky from "ky";
import { Type } from "typebox";
import { Compile } from "typebox/schema";
import { Annotation, LiteLLM, type ModelConfig, SumoPod } from "../extensions/schema";

export class Catalog {
	private client = ky.extend({});

	constructor(private options: Catalog.Options) {}

	async catalog() {
		const { catalog: sumopod, discounts } = await this.sumopod();
		const litellm = await this.litellm();

		const discountMap = Object.fromEntries((discounts ?? []).map(discount => [discount.id, discount]));

		const models: ModelConfig[] = [];
		const unmatched: SumoPod.Model[] = [];
		const nonChat: SumoPod.Model[] = [];
		for (const model of sumopod) {
			const annotation = this.options.annotation?.[model.model_name];
			const liteModel = litellm[annotation?.liteReference ?? "🤨"]
				?? litellm[model.model_name]
				?? litellm[`${model.provider}/${model.model_name}`];

			if (!liteModel) {
				unmatched.push(model);
				continue;
			}

			if (liteModel.mode !== "chat") {
				nonChat.push(model);
				continue;
			}

			const discount = discountMap[model.model_name];
			let modelName = model.model_name;
			if (discount) {
				modelName += ` ·${discount.amount_in_percentage}% off`;
				if (discount.expired_at) {
					modelName += ` until ${discount.expired_at}`;
				}
			}

			const providerModel: ModelConfig = {
				id: model.model_name,
				name: modelName,
				reasoning: liteModel.supports_reasoning === true,
				contextWindow: model.context_length,
				cost: {
					input: model.input_cost_per_1m_tokens,
					output: model.output_cost_per_1m_tokens,
					cacheRead: model.cache_read_cost_per_1m_tokens ?? 0,
					cacheWrite: model.cache_write_cost_per_1m_tokens ?? 0,
				},
				input: ["text"],
				maxTokens: liteModel.max_output_tokens ?? liteModel.max_tokens ?? 0,
				compat: annotation?.compat,
				sumopod: { model, discount },
				annotation,
			};

			if (liteModel.supports_vision === true || liteModel.supports_image_input === true) {
				providerModel.input.push("image");
			}

			models.push(providerModel);
		}

		return { models, unmatched, nonChat };
	}

	private async sumopod() {
		const opts = this.options.sumopod;
		const headers = new Headers();
		headers.set("Authorization", `Bearer ${opts.bearerToken}`);

		const q: Promise<any>[] = [this.client.get(opts.catalogUrl, { headers }).json()];
		if (opts.discountUrl) q.push(this.client.get(opts.discountUrl, { headers }).json());

		const [catalog, discounts] = await Promise.all(q);
		return {
			catalog: Validator.sumopodModels.Parse(catalog),
			discounts: discounts ? Validator.sumopodDiscounts.Parse(discounts) : null,
		};
	}

	private async litellm() {
		const catalog = await this.client.get(this.options.litellm.catalogUrl).json();
		if (catalog == null || typeof catalog != "object") return Validator.litellmModels.Parse(catalog);
		// @ts-expect-error
		const { sample_spec, ...rest } = catalog;
		return Validator.litellmModels.Parse(rest);
	}
}

export namespace Catalog {
	export interface Options {
		sumopod: {
			bearerToken: string;
			catalogUrl: URL;
			discountUrl?: URL;
		};
		litellm: {
			catalogUrl: URL;
		};
		annotation?: Record<string, Annotation.Model>;
	}
}

// compiled here because we don't know whether pi runtime allow eval...
namespace Validator {
	export const sumopodModels = Compile(Type.Array(SumoPod.Model));
	export const sumopodDiscounts = Compile(Type.Array(SumoPod.Discount));
	export const litellmModels = Compile(Type.Record(Type.String(), LiteLLM.Model));
}
