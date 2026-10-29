# JSDoc Preset

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Provides JSDoc config preset and merge helpers.

`createHiaJsdocConfig()` returns a standard JSDoc config that wires `@mandolin/jsdoc-plugin-hia-sys`, `@mandolin/jsdoc-theme-hia`, HIA Integration output and user extra plugins.

The preset defaults to `hia.presentation.pageMode = "multi-page"` and `hia.presentation.sourceMode = "fetch"`. Use
`single-page` for compatibility, or select `embed`, `link` or `none` explicitly. Theme skin and scheme selections are passed
to the JTH bridge; the preset does not implement or copy skins.

The umbrella metadata also embeds `portalUiLocaleBridge`, a translation-free capability descriptor that lets Portal consumers select the
`hia-jsdoc.portal-bridge` completeness profile while keeping the Portal renderer as the sole UI-message owner.

The optional `hia.docSourceMap` setting accepts only `{ enabled: boolean }`. The output filename is fixed by the
JSDoc plugin; a later `baseConfig` override must retain the same closed setting. Omitting it preserves the existing
generated config shape.

## Public API

| Export | Input, defaults and result |
| --- | --- |
| `createHiaJsdocConfig` | `options = {}` → a new JSDoc config. Mode defaults to both; source include defaults to src and the standard JSDoc `.js/.jsdoc/.jsx` pattern; destination defaults to docs/api; integration defaults to destination/hia-integration.json. Theme and Integration are selected by mode unless explicitly overridden. |
| `mergeJsdocConfig` | `(preset, userConfig = {})` → a new merge result. User fields win; plugin arrays are concatenated and deduplicated in first-occurrence order. source/opts/hia and named source/i18n/presentation/theme/integration/umbrella sections are shallow-merged. Deeper nested objects are replaced, not recursively merged. |

Options also accept recurse (default true), extraPlugins, plugin, theme, hia and
baseConfig. The latter is applied last. Project-runner defaults differ from this
low-level preset, notably its broader JavaScript extension pattern and output
root. A baseConfig override does not bypass the project runner's final output
validation. Returned nested user values may retain references; this is not a deep
clone. The preset passes source/i18n metadata and neutral presentation selections
to their owners; it does not itself extract source, translate fields or render HTML.

**Errors:** unknown mode and malformed closed docSourceMap switches throw
TypeError. Low-level config composition is not a complete validator for all
JSDoc, third-party or theme options; use the versioned project loader/runner for
its stricter declared input and output boundaries.

**Side effects:** no filesystem writes or plugin execution. Constructing config
may retain trusted local plugin paths/settings; it is not a publishable artifact.
The merge does not promise recursive ownership isolation or authorization.

中文：配置按既有后覆盖与分层浅合并，不是任意深合并；构造无写盘/执行，项目运行器另核最终输出。生成链内容由插件/主题/Portal各自负责。
