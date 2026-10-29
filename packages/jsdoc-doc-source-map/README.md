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

## Public API

`createJsdocDocSourceMapRef` has signature `(options = {})` and returns a new object with kind
hia-doc-source-map-ref, profile jsdoc, current umbrella profileVersion, href
(default null) and sourcesContentPolicy (default none). The other policies are
reference/embed; the helper copies values and is not their semantic validator.

**Errors:** there is no filesystem/path/policy validator in this helper. Invalid
caller object shapes can fail locally; downstream artifact validation is separate.

**Side effects:** no reads/writes, source embedding, map generation or coordinate
inference. This reference cannot establish same-character source-map precision,
source permission or existence of href. Original stored references are not
migrated, and actual doc-source-map wire version remains 1.1.0.

中文：引用helper只生成元数据，不能把profileVersion当地图wire版本、精度或公开授权。
