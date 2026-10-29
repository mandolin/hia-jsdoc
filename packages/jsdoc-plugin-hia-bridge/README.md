# JSDoc Plugin HIA Bridge

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Bridges the published HIA JSDoc plugin package into the JSDoc umbrella.

The bridge keeps `@mandolin/jsdoc-plugin-hia-sys` as a dependency reference and exposes the standard JSDoc plugin path. It does not migrate or copy JPHS source code.
