# HIA JSDoc

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。

For contributor regression tests, place `hia-jsdoc`, `jsdoc-plugin-hia-sys`,
and `jsdoc-theme-hia` side by side. CI pins both sibling owners in
`.github/workflows/ci.yml` and installs the plugin owner's lock so its JSDoc peer
is visible from the plugin module. Standalone users install the published plugin and
theme through their project configuration. The test checkout does not replace
consumer package installation checks.

中文：贡献者回归使用上述三个相邻仓库，CI精确固定两个owner提交并按插件owner锁安装其JSDoc peer；普通用户按项目配置安装插件和主题，源码联调不代替安装消费验收。


The Portal UI-locale bridge declares capability `1.0.0`, matching the current
`@hia-doc/renderer-html` owner report. Historical `0.1.0-draft` reports remain an
owner reader concern; the bridge does not relabel or rebuild them itself.
中文：Portal界面语言桥接能力同步到1.0.0；旧报告由owner精确读取，桥接层不凭换号升级证据。此源码变更尚未发布npm包。

HIA JSDoc is the JavaScript and JSDoc documentation umbrella workspace for HIA.

This repository provides a preset, runner and bridge layer around JSDoc, `@mandolin/jsdoc-plugin-hia-sys`, `@mandolin/jsdoc-theme-hia`, user JSDoc plugins and HIA integration output.

## Packages

See the [public package/API inventory](API.md) for root/subpath/bin, defaults,
errors, effects and source/i18n generation responsibilities.

- `@hia-doc/jsdoc-spec`: JSDoc usage, configuration and rule drafts for HIA.
- `@hia-doc/jsdoc-preset`: JSDoc config preset and merge helpers.
- `@hia-doc/jsdoc-runner`: Standalone and HIA integration runner.
- `@hia-doc/jsdoc-producer`: Documentation producer adapter for HIA project builds.
- `@hia-doc/jsdoc-plugin-hia-bridge`: Bridge for `@mandolin/jsdoc-plugin-hia-sys`.
- `@hia-doc/jsdoc-theme-bridge`: Bridge for `@mandolin/jsdoc-theme-hia`.
- `@hia-doc/jsdoc-extra-plugin-registry`: User plugin registry and diagnostics.
- `@hia-doc/jsdoc-doc-source-map`: JSDoc documentation source-map inputs.

## Status

The workspace provides:

- a JSDoc preset that composes published JPHS/JTH package paths;
- an extra plugin registry for before/after ordering diagnostics;
- a runner that writes a standard JSDoc config and calls the real JSDoc CLI;
- fixtures that emit multi-page JSDoc HTML, a neutral presentation profile, theme metadata and HIA Integration JSON.
- a project runner/producer surface that emits a `documentation-producer-result` manifest.
- a first-party self-doc smoke using canonical `@lang` tags.

It does not migrate or absorb the existing plugin and theme repositories.

Standalone HTML uses multi-page output and fetch-based source reading by default. The preset also exposes explicit
single-page compatibility and `embed`, `link` or `none` source modes under `opts.hia.presentation`. Skin implementation and
the skin catalog remain owned by `@mandolin/jsdoc-theme-hia`; the umbrella bridge carries only the selected skin/scheme and
the catalog projection reference.

## Configuration and artifact compatibility

New project configuration and umbrella metadata use `1.0.0`; exact historical
`0.1.0-draft` configuration remains readable without mutation. The runner ships
both schemas and an explicit lossless migration API. See the
[runner configuration reference](packages/jsdoc-runner/README.md#versioned-project-configuration).
Integration and page-map retain exact `0.1.0` compatibility profiles; source maps
remain `1.1.0`, while producer/presentation/UI-locale contracts remain `1.0.0`.
These are independent wire identities, not a statement that every package is
already published at version 1.0.0. See [profile guarantees](COMPATIBILITY.md).

中文：配置/umbrella采用1.0.0，历史读取不改对象，迁移显式执行；必要工件身份分别承诺，不以统一换号代替兼容验证。

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
