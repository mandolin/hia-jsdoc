# HIA JSDoc

HIA JSDoc is the JavaScript and JSDoc documentation umbrella workspace for HIA.

This repository is planned as a preset, runner and bridge layer around JSDoc, `@mandolin/jsdoc-plugin-hia-sys`, `@mandolin/jsdoc-theme-hia`, user JSDoc plugins and HIA integration output.

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
- a fixture that emits JSDoc HTML, theme metadata and HIA Integration JSON.
- a W-P11.3 project runner/producer surface that emits a `documentation-producer-result` manifest.
- a first-party self-doc smoke using canonical `@lang` tags.

It does not migrate or absorb the existing plugin and theme repositories.

## Development

```sh
npm run build:fixtures
npm run check:fixtures
npm run release:gate
```
