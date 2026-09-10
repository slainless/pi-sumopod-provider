import { cleanEnv, str } from "envalid";
import { Type } from "typebox";
import { Compile } from "typebox/schema";
import { IncrementalReasoningProbe } from "../core/reasoning-probe/incremental";
import annotation from "../data/annotation.jsonc" with { type: "json" };
import { Annotation } from "../extensions/schema";
const Validator = Compile(Type.Record(Type.String(), Annotation.Model));
Validator.Parse(annotation);

const envs = cleanEnv(process.env, {
	SUMOPOD_API_KEY: str(),
});

const probe = new IncrementalReasoningProbe(annotation, {
	chatUrl: new URL("https://ai.sumopod.com/v1/chat/completions"),
	apiKey: envs.SUMOPOD_API_KEY,
});
