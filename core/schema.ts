import { Type } from "typebox";

export namespace SumoPod {
	export const Model = Type.Object({
		model_name: Type.String(),
		provider: Type.Optional(Type.String()),
		input_cost_per_1m_tokens: Type.Number(),
		output_cost_per_1m_tokens: Type.Number(),
		cache_read_cost_per_1m_tokens: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
		cache_write_cost_per_1m_tokens: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
		context_length: Type.Number(),
	});

	export type Model = Type.Static<typeof Model>;

	export const Discount = Type.Object({
		id: Type.String(),
		amount_in_percentage: Type.Number(),
		expired_at: Type.Any(),
	});
	export type Discount = Type.Static<typeof Discount>;
}

export namespace LiteLLM {
	export enum Mode {
		CHAT = "chat",
		EMBEDDING = "embedding",
		COMPLETION = "completion",
		IMAGE_GENERATION = "image_generation",
		AUDIO_TRANSCRIPTION = "audio_transcription",
		AUDIO_SPEECH = "audio_speech",
		MODERATION = "moderation",
		RERANK = "rerank",
		SEARCH = "search",
		RESPONSES = "responses",
		REALTIME = "realtime",
		OCR = "ocr",
		GUARDRAIL = "guardrail",
		IMAGE_EDIT = "image_edit",
		VIDEO_GENERATION = "video_generation",
		VECTOR_STORE = "vector_store",
	}

	export const Model = Type.Object({
		mode: Type.Optional(Type.Enum(Mode)),
		max_input_tokens: Type.Optional(Type.Number()),
		max_output_tokens: Type.Optional(Type.Number()),
		max_tokens: Type.Optional(Type.Number()),
		supports_reasoning: Type.Optional(Type.Boolean()),
		supports_vision: Type.Optional(Type.Boolean()),
		supports_image_input: Type.Optional(Type.Boolean()),
	});

	export type Model = Type.Static<typeof Model>;
}

export namespace Annotation {
	const ThinkingFormat = Type.Object({
		baselineReasoning: Type.Optional(Type.Boolean()),
		supported: Type.Union([
			Type.Literal("always"),
			Type.Literal(false),
			Type.Array(Type.Object({
				id: Type.String(),
			})),
		]),
		rejected: Type.Optional(Type.Array(Type.Object({
			id: Type.String(),
			reason: Type.String(),
		}))),
		drift: Type.Optional(Type.Array(Type.Object({
			id: Type.String(),
			fields: Type.Array(Type.Object({
				field: Type.String(),
				allowedValue: Type.Array(Type.Any()),
			})),
		}))),
		reason: Type.Optional(Type.String()),
	});

	export const Model = Type.Object({
		liteReference: Type.Optional(Type.String()),
		compat: Type.Optional(Type.Any()),
		thinkingFormat: Type.Optional(ThinkingFormat),
	});

	export type Model = Type.Static<typeof Model>;
}
