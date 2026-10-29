# JSDoc Doc Source Map

New `createJsdocDocSourceMapRef()` values carry umbrella `profileVersion: "1.0.0"`.
This metadata helper does not change the actual `doc-source-map@1.1.0` artifact,
infer source precision, migrate saved references or authorize disclosure. Existing
saved reference objects remain unchanged; their profile version is not the map
wire version.

中文：新引用的profileVersion随umbrella为1.0.0；它不是地图wire版本或精度证明，旧引用不自动改写。

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Defines JSDoc documentation source-map inputs.

The current slice only exposes a source-map reference helper. TS/CoffeeScript/LiveScript generated JS linkage remains a later bridge task.
