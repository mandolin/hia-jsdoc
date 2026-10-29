# JSDoc Spec

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Defines HIA JSDoc usage, configuration and compatibility rules.

The current umbrella configuration identity is `hia-jsdoc-umbrella-config@1.0.0`.
`createHiaJsdocVersionSummary()` and new preset metadata use this identity; their
plugin/theme numbers continue to describe the declared published dependencies.
`readHiaJsdocUmbrellaConfig(metadata)` admits only exact `1.0.0` and
`0.1.0-draft`, returning the original object and version. Invalid/missing identities
throw a fixed `TypeError`. This helper checks **identity only**, without validating
nested payloads, migrating them or authorizing execution. It does not select
versions through a SemVer range.

Integration `hia-jsdoc-integration@0.1.0` and page-map
`jsdoc-theme-hia/page-map@0.1.0` remain required compatibility profiles. Their wire
versions are independent of package and umbrella versions. Future incompatible
wire changes require a new wire identity; a tool package reaching 1.0.0 does not
relabel saved artifacts. Source-map 1.1.0 and presentation/UI-locale 1.0.0 keep
their existing readers and validation boundaries.

中文：umbrella当前1.0.0，旧元数据精确身份读取保持原对象；仅身份检查不代表内容或权限验证。Integration与页映射保留0.1.0并纳入正式兼容责任，不能借0.x标签排除保证，亦不凭包版本改写工件。

`createHiaJsdocPortalUiLocaleBridge()` exposes the metadata-only Portal adoption descriptor for
`documentation-ui-locale-completeness@1.0.0`. The descriptor delegates message catalogs, runtime behavior, HTML/CSS and report generation to
`@hia-doc/renderer-html`; it contains no translations or target-project identity.

Historical `0.1.0-draft` report reading remains with the shared owner; this
bridge does not relabel or rebuild reports.
中文：桥接声明当前1.0.0能力，旧报告由共享owner精确读取，不换号伪造迁移。

## Complete public API

| Export | Meaning/default |
| --- | --- |
| `HIA_JSDOC_UMBRELLA_CONTRACT` | hia-jsdoc-umbrella-config identity. |
| `HIA_JSDOC_UMBRELLA_CONTRACT_VERSION` | Current 1.0.0. |
| `HIA_JSDOC_PLUGIN_PACKAGE` | @mandolin/jsdoc-plugin-hia-sys. |
| `HIA_JSDOC_PLUGIN_VERSION` | Declared published edge 0.1.0, not latest source. |
| `HIA_JSDOC_PLUGIN_PATH` | node_modules/@mandolin/jsdoc-plugin-hia-sys/src/index.cjs. |
| `HIA_JSDOC_THEME_PACKAGE` | @mandolin/jsdoc-theme-hia. |
| `HIA_JSDOC_THEME_VERSION` | Declared published edge 0.1.0. |
| `HIA_JSDOC_THEME_TEMPLATE` | node_modules/@mandolin/jsdoc-theme-hia. |
| `HIA_JSDOC_PRESENTATION_PROFILE_CONTRACT` | documentation-presentation-profile. |
| `HIA_JSDOC_PRESENTATION_PROFILE_CONTRACT_VERSION` | Current 1.0.0. |
| `HIA_JSDOC_PORTAL_UI_LOCALE_CAPABILITY` | documentation-ui-locale-completeness. |
| `HIA_JSDOC_PORTAL_UI_LOCALE_CAPABILITY_VERSION` | Current 1.0.0. |
| `HIA_JSDOC_PORTAL_UI_LOCALE_PROFILE_ID` | hia-jsdoc.portal-bridge. |
| `HIA_JSDOC_PORTAL_UI_LOCALE_REPORT_PATH` | documentation-ui-locale-completeness.json. |
| `JSDOC_PACKAGE` | jsdoc. |
| `JSDOC_VERSION` | Tested 4.0.5; no blanket guarantee for future 4.x. |
| `HIA_JSDOC_OUTPUT_MODES` | Frozen standalone/hiaIntegration/both array. |
| `HIA_JSDOC_EXTRA_PLUGIN_PHASES` | Frozen before/after array. |
| `normalizeHiaJsdocMode` | mode defaults both; returns admitted mode or throws Error for unknown values. Trusted local error text includes the supplied mode. |
| `createHiaJsdocVersionSummary` | No arguments; new umbrella/dependency metadata object. No registry lookup. |
| `createHiaJsdocPortalUiLocaleBridge` | No arguments; new metadata-only capability descriptor for renderer-html, two UI locales and interactive/no-script surfaces. Not a report or copied catalog. |
| `readHiaJsdocUmbrellaConfig` | Exact identity-only reader described above, no nested payload validation or implicit migration. |

**Errors:** mode normalization and the identity reader reject unsupported input;
other constants/builders do not validate existence, availability or source consent.
Use the project input boundary before publishing errors from trusted local helpers.

**Side effects:** no filesystem/network reads, installation, plugin execution or
rendering. Constants and version summaries do not prove npm publication, map
precision, site availability or UI acceptance.

中文：二十二个导出按真实责任列明；默认依赖摘要仍为manifest已声明边，不能把源码/契约1.0.0当作npm已发布。
