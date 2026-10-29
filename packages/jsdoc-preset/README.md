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
