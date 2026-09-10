import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export class APIKeyConfig {
	#key?: string;

	key() {
		return this.#key;
	}

	async setKey(key: string) {
		const authPath = join(getAgentDir(), "auth.json");
		const existing = await readFile(authPath, { encoding: "utf8" });

		// @ts-expect-error...
		existing.sumopod = { type: "api_key", key };

		await writeFile(authPath, JSON.stringify(existing, null, 2), { encoding: "utf-8", mode: 0o600 });
		try {
			await chmod(authPath, 0o600);
		} catch {}

		this.#key = key;
	}
}
