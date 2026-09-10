import ky, { HTTPError } from "ky";

export class ReasoningProbe {
	private readonly client;

	constructor(private readonly options: ReasoningProbe.Options) {
		this.client = ky.create({
			headers: {
				Authorization: `Bearer ${options.apiKey}`,
				Accept: "application/json",
			},
			retry: { limit: 0 },
			timeout: options.timeout ?? 30_000,
		});
	}

	async probe(model: string, unit: ReasoningProbe.TestUnitName) {
		const parameters = ReasoningProbe.TestUnit[unit];
		const response = await this.client
			.post(this.options.chatUrl, {
				json: {
					model,
					messages: [{
						role: "user",
						content:
							"Think step by step. A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Show your reasoning.",
					}],
					max_tokens: 1024,
					temperature: 1,
					stream: false,
					...parameters,
				},
			})
			.json();

		return this.parseReasoning(response);
	}

	private parseReasoning(response: any) {
		const choices = response.choices;
		if (!Array.isArray(choices)) return;

		const reasonings = choices
			.map((choice) => {
				if (!choice || typeof choice !== "object") return null;
				const message = choice?.message;
				const reasoning = message?.reasoning_content ?? message?.reasoning ?? message?.reasoning_text ?? null;
				const length = typeof reasoning === "string" ? reasoning.length : 0;
				return { reasoning, length };
			})
			.filter(choice => choice);

		return {
			reasonings,
			tokens: response?.completion_tokens_details?.reasoning_tokens ?? null,
		};
	}
}

export namespace ReasoningProbe {
	export interface Options {
		apiKey: string;
		chatUrl: URL;
		timeout?: number;
	}

	export const TestUnit = {
		v0_baseline: {},
		v1_openai: { reasoning_effort: "high" },
		v2_openrouter: { reasoning: { effort: "high" } },
		v3_qwen: { enable_thinking: true },
		v4_qwen_chat_template: {
			chat_template_kwargs: { enable_thinking: true, preserve_thinking: true },
		},
		// should be v0_baseline
		// v5_reasoning_obj: {},
		v6_deepseek: { thinking: { type: "enabled" }, reasoning_effort: "high" }, // requires: thinking.enabled.budget_tokens
		v7_together: { reasoning: { enabled: true }, reasoning_effort: "high" }, //
		v8_baseten: { chat_template_args: { enable_thinking: true }, reasoning_effort: "high" },
		v9_zai: { thinking: { type: "enabled" } },
		v10_chat_template: { chat_template_kwargs: { thinking: { enabled: true } } },
		v11_string_thinking: { thinking: "high" }, // thinking must be object...
		v12_ant_ling: { reasoning: { effort: "high" } },
	} as const;

	export type TestUnitName = keyof typeof TestUnit;
}
