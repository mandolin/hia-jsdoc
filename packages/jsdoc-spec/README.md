# JSDoc Spec

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Defines HIA JSDoc usage, configuration and rule drafts.

The current draft records the umbrella config contract, published JPHS/JTH dependency versions, standard plugin paths and supported output modes.

`createHiaJsdocPortalUiLocaleBridge()` exposes the metadata-only Portal adoption descriptor for
`documentation-ui-locale-completeness@1.0.0`. The descriptor delegates message catalogs, runtime behavior, HTML/CSS and report generation to
`@hia-doc/renderer-html`; it contains no translations or target-project identity.

Historical `0.1.0-draft` report reading remains with the shared owner; this
bridge does not relabel or rebuild reports.
中文：桥接声明当前1.0.0能力，旧报告由共享owner精确读取，不换号伪造迁移。
