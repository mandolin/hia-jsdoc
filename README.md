# HIA JSDoc

The Portal UI-locale bridge declares capability `1.0.0`, matching the current
`@hia-doc/renderer-html` owner report. Historical `0.1.0-draft` reports remain an
owner reader concern; the bridge does not relabel or rebuild them itself.
中文：Portal界面语言桥接能力同步到1.0.0；旧报告由owner精确读取，桥接层不凭换号升级证据。此源码变更尚未发布npm包。

HIA JSDoc is the JavaScript and JSDoc documentation umbrella workspace for HIA.

This repository provides a preset, runner and bridge layer around JSDoc, `@mandolin/jsdoc-plugin-hia-sys`, `@mandolin/jsdoc-theme-hia`, user JSDoc plugins and HIA integration output.

## Packages

- `@hia-doc/jsdoc-spec`: JSDoc usage, configuration and rule drafts for HIA.
- `@hia-doc/jsdoc-preset`: JSDoc config preset and merge helpers.
- `@hia-doc/jsdoc-runner`: Standalone and HIA integration runner.
- `@hia-doc/jsdoc-producer`: Documentation producer adapter for HIA project builds.
- `@hia-doc/jsdoc-plugin-hia-bridge`: Bridge for `@mandolin/jsdoc-plugin-hia-sys`.
- `@hia-doc/jsdoc-theme-bridge`: Bridge for `@mandolin/jsdoc-theme-hia`.
- `@hia-doc/jsdoc-extra-plugin-registry`: User plugin registry and diagnostics.
- `@hia-doc/jsdoc-doc-source-map`: JSDoc documentation source-map inputs.

## Status

This workspace contains the W-P9.5 umbrella baseline:

- a JSDoc preset that composes published JPHS/JTH package paths;
- an extra plugin registry for before/after ordering diagnostics;
- a runner that writes a standard JSDoc config and calls the real JSDoc CLI;
- fixtures that emit multi-page JSDoc HTML, a neutral presentation profile, theme metadata and HIA Integration JSON.
- a W-P11.3 project runner/producer surface that emits a `documentation-producer-result` manifest.
- a first-party self-doc smoke using canonical `@lang` tags.

It does not migrate or absorb the existing plugin and theme repositories.

Standalone HTML uses multi-page output and fetch-based source reading by default. The preset also exposes explicit
single-page compatibility and `embed`, `link` or `none` source modes under `opts.hia.presentation`. Skin implementation and
the skin catalog remain owned by `@mandolin/jsdoc-theme-hia`; the umbrella bridge carries only the selected skin/scheme and
the catalog projection reference.

## Optional documentation source map

Set `options.hia.docSourceMap.enabled` to `true` in a project runner config to request a standalone
`hia-doc-source-map.json` beside `hia-integration.json`. The fixed sidecar uses `doc-source-map@1.1.0` and does not embed
source text. The default remains disabled. The runner inventories a map only after checking its structure, safe paths,
privacy policy and symbol references against the integration output from the same build. Unsupported or unverifiable
source positions remain without a precise range.

## Development

```sh
npm run build:fixtures
npm run check:fixtures
npm run release:gate
```
