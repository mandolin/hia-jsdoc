# HIA JSDoc

HIA JSDoc is the JavaScript and JSDoc documentation umbrella workspace for HIA.

This repository is planned as a preset, runner and bridge layer around JSDoc, `@mandolin/jsdoc-plugin-hia-sys`, `@mandolin/jsdoc-theme-hia`, user JSDoc plugins and HIA integration output.

## Packages

- `@hia-doc/jsdoc-spec`: JSDoc usage, configuration and rule drafts for HIA.
- `@hia-doc/jsdoc-preset`: JSDoc config preset and merge helpers.
- `@hia-doc/jsdoc-runner`: Standalone and HIA integration runner.
- `@hia-doc/jsdoc-plugin-hia-bridge`: Bridge for `@mandolin/jsdoc-plugin-hia-sys`.
- `@hia-doc/jsdoc-theme-bridge`: Bridge for `@mandolin/jsdoc-theme-hia`.
- `@hia-doc/jsdoc-extra-plugin-registry`: User plugin registry and diagnostics.
- `@hia-doc/jsdoc-doc-source-map`: JSDoc documentation source-map inputs.

## Status

This workspace is currently a bootstrap skeleton. It does not migrate or absorb the existing plugin and theme repositories.

## Development

```sh
npm run release:gate
```
