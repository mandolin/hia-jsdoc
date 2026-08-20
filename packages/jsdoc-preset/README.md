# JSDoc Preset

Provides JSDoc config preset and merge helpers.

`createHiaJsdocConfig()` returns a standard JSDoc config that wires `@mandolin/jsdoc-plugin-hia-sys`, `@mandolin/jsdoc-theme-hia`, HIA Integration output and user extra plugins.

The preset defaults to `hia.presentation.pageMode = "multi-page"` and `hia.presentation.sourceMode = "fetch"`. Use
`single-page` for compatibility, or select `embed`, `link` or `none` explicitly. Theme skin and scheme selections are passed
to the JTH bridge; the preset does not implement or copy skins.
