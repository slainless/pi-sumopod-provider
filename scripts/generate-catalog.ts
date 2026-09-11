import { cleanEnv, str } from "envalid";
import { join } from "node:path";
import { Type } from "typebox";
import { Parse } from "typebox/schema";
import { Catalog } from "../core/catalog";
import rawAnnotation from "../data/annotation.jsonc" with { type: "jsonc" };
import { Annotation } from "../extensions/schema";
const annotation = Parse(Type.Record(Type.String(), Annotation.Model), rawAnnotation);

const envs = cleanEnv(process.env, {
	SUMOPOD_BEARER: str(),
});

const catalog = new Catalog({
	litellm: {
		catalogUrl: new URL("https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"),
	},
	sumopod: {
		bearerToken: envs.SUMOPOD_BEARER,
		catalogUrl: new URL("https://api-gate-v2.sumopod.com/webhook/sumopod/ai/models"),
		discountUrl: new URL("https://api-gate-v2.sumopod.com/webhook/sumopod/ai/model-discounts"),
	},
	annotation,
});

const result = await catalog.catalog();
await Bun.write(join("output", "catalog.json"), JSON.stringify(result, null, 2));
