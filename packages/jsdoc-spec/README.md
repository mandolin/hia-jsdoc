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
