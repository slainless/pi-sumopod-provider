# pi-sumopod-provider

A [pi](https://github.com/earendil-works/pi) extension that adds the [SumoPod](https://sumopod.com) provider and models to pi.

## Catalog

The catalog is a generated snapshot of the SumoPod model list and model metadata required by pi, including pricing, context limits, reasoning support, vision support, and compatibility settings.

By default, the extension downloads `catalog.json` from the latest release of this repository. It loads the catalog once and caches it in pi's agent directory:

```text
<pi-agent-dir>/sumopod/catalog-data.json
```

Subsequent starts use the cached copy. Refresh it when needed:

```text
/sumopod-catalog-refresh
```

You can also:

- Point pi at another catalog with `/sumopod-catalog-url <url>`.
- Edit `<pi-agent-dir>/sumopod/catalog-data.json` directly.
- Host your own compatible `catalog.json` and configure the extension to use its URL.

> [!IMPORTANT]
> The catalog may lag behind SumoPod's currently available models. Automatic generation is not currently possible because SumoPod's model catalog is behind authentication and Cloudflare protection. Releases therefore contain the latest catalog that could be generated and verified manually.

## Technical details

### Catalog generation

[`core/catalog.ts`](core/catalog.ts) combines:

1. The authenticated SumoPod model catalog and discounts.
2. The public [LiteLLM model catalog](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json).
3. Local annotations from [`data/annotation.jsonc`](data/annotation.jsonc).

It matches SumoPod models to LiteLLM metadata, removes non-chat models, applies annotations, and produces pi `ProviderModelConfig` entries. Models that cannot be matched are reported as `unmatched` rather than included silently.

### Reasoning probe and annotations

[`core/reasoning-probe`](core/reasoning-probe) tests how each model behaves through SumoPod's OpenAI-compatible chat endpoint. It checks which reasoning/thinking request formats are accepted, rejected, ignored, or require special handling.

Though, the results are tracked manually to `data/annotation.jsonc`. The annotation can provide:

- A LiteLLM model reference when the model name does not match directly.
- The compatibility format pi should use.
- Supported reasoning formats and known rejected formats.
- Model-specific constraints, such as always-on reasoning or field overrides.

Since there is no good heuristic for the probe yet, the annotation so far is only manually handcrafted.

### Creating a catalog

The intended workflow is:

1. Add the new model to [`data/annotation.jsonc`](data/annotation.jsonc).
2. Run the reasoning probe to check suitable OpenAI-compatible options:

   ```sh
   bun run probe.report
   ```

3. Add the probe findings back to the model's annotation.
4. Build the catalog when the annotations are complete:

   ```sh
   SUMOPOD_BEARER=... bun run catalog
   ```

5. Upload `output/catalog.json` to a repository release as `catalog.json`.

The release asset is then used by the default catalog URL.

## Commands

| Command                      | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `/sumopod-catalog-refresh`   | Download and cache the catalog from the configured URL. |
| `/sumopod-catalog-url <url>` | Use a different catalog URL and load it immediately.    |

The catalog URL can also be entered interactively when the command is run without an argument.

## License

MIT
