import { HTTPError } from "ky";
import type { Annotation } from "../../extensions/schema";
import { ReasoningProbe } from "./base";

export class IncrementalReasoningProbe extends ReasoningProbe {
	constructor(private annotation: Record<string, Annotation.Model>, options: ReasoningProbe.Options) {
		super(options);
	}

	async fullProbe(model: string) {
		type ReasoningResult = Awaited<ReturnType<typeof this.probe>>;
		interface Result {
			id: ReasoningProbe.TestUnitName;
			result?: ReasoningResult;
			error?: any;
		}

		const { annotation, units } = this.buildProbeUnits(model);
		if (units.length <= 0) {
			if (annotation) return [];
			throw new TypeError("Invalid state: annotation is missing but probe units is empty");
		}

		if (
			annotation?.thinkingFormat?.supported === "always"
			|| annotation?.thinkingFormat?.supported === false
		) {
			return [];
		}

		const results: Result[] = [];
		// intentional sequential call
		for (const unit of units) {
			try {
				const result = await this.probe(model, unit);
				results.push({ id: unit, result });
			} catch (e) {
				if (e instanceof HTTPError) {
					const error = {
						status: e.response.status,
						body: e.data,
					};
					results.push({ id: unit, error });
				} else if (e instanceof Error) {
					results.push({
						id: unit,
						error: { message: e.message },
					});
				}
			}
		}

		return results;
	}

	private buildProbeUnits(model: string) {
		const all = () => Object.keys(ReasoningProbe.TestUnit) as ReasoningProbe.TestUnitName[];
		type Result = {
			annotation?: Annotation.Model;
			units: ReasoningProbe.TestUnitName[];
		};

		const annotation = this.annotation[model];
		const format = annotation?.thinkingFormat;
		const result: Result = { annotation, units: [] };
		if (format == null) {
			result.units = all();
			return result;
		}
		if (format.supported === false || format.supported === "always") return result;

		const tested = [
			...format.supported.map(f => f.id),
			...format.rejected?.map(f => f.id) ?? [],
		];

		const untested = new Set(all()).difference(new Set(tested));
		if (format.baselineReasoning != null) untested.delete("v0_baseline");
		result.units = Array.from(untested);
		return result;
	}
}
