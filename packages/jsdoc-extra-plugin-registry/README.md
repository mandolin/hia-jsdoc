# JSDoc Extra Plugin Registry

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Tracks user JSDoc plugin configuration, ordering and diagnostics.

The registry currently supports `before` and `after` phases around the HIA plugin and emits diagnostics for invalid or unsafe plugin entries.

## Public API

`normalizeExtraPluginRegistry` has signature `(input = {})` and returns `{before, after, diagnostics, order}`.
Each phase accepts strings or `{module?, package?, optional?, config?}` objects;
`module` precedes its `package` alias. `before`/`after` take precedence over
`pre`/`post` using nullish fallback. Entries retain order and duplicates;
`optional` is boolean-coerced, and an object-shaped `config` is retained by reference.
The final order inserts the `hia-jsdoc-plugin` marker between the two phases.
The preset subsequently deduplicates plugin paths when merging its final config.

**Errors:** malformed phase lists/entries become warning diagnostics with
`HIA_JSDOC_PLUGIN_LIST_INVALID`, `HIA_JSDOC_PLUGIN_ENTRY_INVALID` or
`HIA_JSDOC_PLUGIN_PATH_UNSAFE`. Rejected paths are omitted from diagnostic data;
only phase and index are retained. The input contract expects an object;
explicit null is not an alternate empty registry. Existing lexical checks reject
`..` and drive-root paths; they are not a universal path validator or a sandbox.

**Side effects:** no filesystem reads, writes or module execution. Successful
entries are trusted local configuration, potentially containing private paths or
settings, and must not be published as raw diagnostics. Third-party plugins run
with the JSDoc process's permissions; optional is metadata, not an install or
missing-plugin suppression guarantee.

中文：规范化不执行插件，保留顺序/重复与配置引用；拒绝诊断不含原路径。词法筛选不是沙箱，optional也不保证忽略CLI加载失败。
