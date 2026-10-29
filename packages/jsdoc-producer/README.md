# HIA JSDoc Producer

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Documentation producer adapter for HIA JSDoc.

This package exposes a thin `documentation-producer@1.0.0` descriptor and delegates all work to `@hia-doc/jsdoc-runner`.

New ordinary and staged runs emit `documentation-producer-result@1.0.0`.
Use the matching `@hia-doc/plugin-sdk` 1.0.0 source candidate to validate or run
them. That reader also accepts exactly historical `0.1.0-draft` descriptors and
results, preserving their original objects and versions. This producer does not
load or relabel stored results. A new writer version does not upgrade package
versions, JSDoc Integration, presentation profiles or source maps.

中文：新描述与结果采用已确认SDK1.0.0，旧结果由匹配reader精确读取，不改原对象或版本；这是协议采用，不是npm新包发布或其它工件换号。

`@hia-doc/jsdoc-producer/staged` is a companion adapter for multi-repository orchestration. It builds in a temporary directory inside the JSDoc workspace, then copies the resulting artifacts to the caller's output directory. This preserves the runner's workspace path boundary while allowing the HIA CLI to keep all project artifacts under one output root.

The staged adapter clears any prior `hia-doc-source-map.json` in a reused caller output and copies the current sidecar
only when the runner includes it in the producer result. A failed run does not copy staging output.

The staged copy excludes the runner's private `.hia-jsdoc` configuration
directory, which may contain local paths or plugin settings. Copying remains
additive: it does not erase unrelated files or old configuration already in a
consumer directory. Use a clean deployment directory when publishing a site.

中文：暂存复制排除本轮运行器的私有配置目录；既有目标目录仍为追加复制，不擅自删除其中原有内容，发布时应使用干净部署目录。
