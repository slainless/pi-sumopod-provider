import { cleanEnv, str } from "envalid";
import { open } from "node:fs/promises";
import { join } from "node:path";
import { Type } from "typebox";
import { Parse } from "typebox/schema";
import { IncrementalReasoningProbe } from "../core/reasoning-probe/incremental";
import { Annotation } from "../core/schema";
import rawAnnotation from "../data/annotation.jsonc" with { type: "jsonc" };
const annotation = Parse(Type.Record(Type.String(), Annotation.Model), rawAnnotation);

const envs = cleanEnv(process.env, {
	SUMOPOD_API_KEY: str(),
});

const probe = new IncrementalReasoningProbe(annotation, {
	chatUrl: new URL("https://ai.sumopod.com/v1/chat/completions"),
	apiKey: envs.SUMOPOD_API_KEY,
});

const reportName = `reasoning-report-${Temporal.Now.plainDateISO().toString()}-${Date.now()}.ndjson`;
const file = await open(join("experiment", reportName), "wx");

console.log(`Writing report to ../${reportName}`);

const length = Object.keys(annotation).length;
let i = 1;
for (const model in annotation) {
	console.log(`[${i}/${length}] Probing ${model}...`);
	const result = await probe.fullProbe(model);
	file.write(JSON.stringify({ id: model, result }) + "\n");
	i++;
}

await file.close();
console.log(`Done.`);
