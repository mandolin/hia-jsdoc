# JSDoc Plugin HIA Bridge

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Bridges the published HIA JSDoc plugin package into the JSDoc umbrella.

The bridge keeps `@mandolin/jsdoc-plugin-hia-sys` as a dependency reference and exposes the standard JSDoc plugin path. It does not migrate or copy JPHS source code.

## Public API

| Export | Behavior |
| --- | --- |
| `createHiaJsdocPluginBridge` | `options = {}` → new `{package, version, pluginPath, order}`. Overrides are packageName/version/pluginPath/order; defaults come from jsdoc-spec, with order hia-core. Nullish overrides use defaults. |
| `getHiaJsdocPluginPath` | `options = {}` → the descriptor's pluginPath. |

**Errors:** these helpers do not validate custom package versions or prove path
existence; invalid local objects/types may fail at consumption. They do not
resolve a selected version from the registry. The default path is
node_modules/@mandolin/jsdoc-plugin-hia-sys/src/index.cjs, interpreted in the
consumer's JSDoc environment. The version summary describes the declared edge,
not a newly released source owner's version.

**Side effects:** no I/O, installation or module execution; no plugin source is
copied. Custom paths are trusted local execution configuration, not sandboxed
requests or source disclosure permission.

中文：两个helper只投影既有默认与覆盖，不证明registry、文件存在性或执行权限，不复制插件实现。
