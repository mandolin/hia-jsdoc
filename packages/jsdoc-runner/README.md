# JSDoc Runner

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Runs JSDoc in standalone and HIA integration modes.

## Versioned project configuration

New project configurations use `schemaVersion: "1.0.0"`. Only `schemaVersion`
and a nonempty `inputs` array are required. Each input requires `path`;
omitted `kind` becomes `javascript-module` for a case-insensitive `.mjs` suffix,
otherwise `javascript-source`. Omitted `workspaceRoot` is `.` relative to the
config file; omitted `outputDirectory` is `dist/hia-jsdoc` relative to that root.
Paths must remain relative without parent traversal. Explicit `null` is invalid
for these current fields and `profileIds`.

```json
{"schemaVersion":"1.0.0","inputs":[{"path":"src"}]}
```

| API | Behavior |
| --- | --- |
| `loadHiaJsdocConfig(path, {cwd?})` | Reads JSON, dispatches its exact identity, returns a normalized runtime request. Does not write outputs or execute plugins. |
| `readHiaJsdocConfig(value)` | Validates exact current/legacy identity and existing runtime semantics, returns the **same object** without changing versions or filling defaults. |
| `migrateHiaJsdocConfig(value)` | Explicitly creates a detached current JSON configuration, preserves representable extensions/omissions, updates an existing `$schema`, then rechecks current rules. Does not write files. |
| `getHiaJsdocConfigSchema(version = "1.0.0")` | Selects only `1.0.0` or exact `0.1.0-draft`; unknown versions throw `TypeError`. |

Schema constants `HIA_JSDOC_CONFIG_JSON_SCHEMA`, `HIA_JSDOC_CONFIG_SCHEMA_ID` and
`HIA_JSDOC_CONFIG_SCHEMA_VERSION` describe the current version. The corresponding
`HIA_JSDOC_LEGACY_CONFIG_*` constants preserve the historical schema/ID/version.
Both JSON resources are shipped through public package subpaths:

```js
import {migrateHiaJsdocConfig} from "@hia-doc/jsdoc-runner";
import schema from "@hia-doc/jsdoc-runner/schemas/hia-jsdoc-config-1.0.0.schema.json" with {type: "json"};
const oldConfig = {schemaVersion: "0.1.0-draft", inputs: [{path: "src"}]};
const currentConfig = migrateHiaJsdocConfig(oldConfig);
// oldConfig remains unchanged; persist currentConfig explicitly if desired.
```

The matching historical subpath ends in `hia-jsdoc-config-0.1.0-draft.schema.json`.
`$id` is a stable identifier, not a promise that its URL currently serves a file.
Schema `default` annotations do not mutate input. The historical schema is
unchanged: it still requires both directories and `kind`, while its historical
loader already accepted their omission and certain null defaults. Exact legacy
reading preserves that behavior; it is **not** a historical schema conformance
claim. Migration rejects old nulls that current rules cannot represent without
coercion. Resolve those explicitly before migrating.

Unknown/mismatched identities, invalid types/paths, unknown closed fields and
unrepresentable migration values throw fixed `TypeError` messages. Migration
rejects cycles, functions, undefined, non-finite numbers, accessors, special
objects and sparse arrays instead of silently losing data. Open JSON extensions
are preserved. Filesystem and plugin execution safety still require the project
runner's execution-time checks; reading is not execution permission.

中文：当前配置1.0.0与旧0.1.0-draft分别精确读取；旧schema原样分发，默认只在运行请求中填充。显式迁移返回独立对象，保留可表示扩展，不能无损迁移时明确拒绝；不自动写盘或执行插件。

`runHiaJsdoc()` writes a generated config file and invokes the real JSDoc CLI from the installed `jsdoc` package.

`runHiaJsdocProject()` wraps the same JSDoc execution in a `documentation-producer-result` contract for HIA project builds.

New project results use contract version `1.0.0`, matching the current
`@hia-doc/plugin-sdk` reader. Existing saved `0.1.0-draft` results remain unchanged
and require an exact compatible reader. This does not change the package version
or the config, Integration, page-map and source-map identities.
If execution produces no artifacts, the result is `failed` with
`HIA_JSDOC_OUTPUT_EMPTY`; a zero CLI exit code alone cannot establish success.

中文：新运行结果采用已确认的1.0.0协议；不换号迁移历史结果，也不改变其它工件身份或宣布npm可用。

## Project input and output boundaries

Project options enforce their declared string, boolean and object types. Omission
selects defaults; an explicit `null` does not substitute for a valid option.
Profile identifiers must be unique. Existing open configuration extensions and
non-output `baseConfig` precedence remain supported.

The project wrapper validates the **effective merged configuration before any
output creation or stale-map cleanup**, in every mode. `opts.destination` must
resolve to the requested `outputDirectory`; enabled integration must write its
fixed `hia-integration.json` there. Other-build or outside destinations are
rejected. Equivalent paths are accepted when mapping is disabled; the existing
stricter enabled-map pairing rules remain in effect. Disabled integration does
not interpret its unused output path.

Public producer results and CLI failures omit raw JSDoc output, private argument
values, configuration excerpts and local filesystem errors. Config loading
reports fixed `SyntaxError`/read errors; the trusted low-level `runHiaJsdoc()`
interface retains raw `stdout`/`stderr` for local debugging. Generated configs
are local runtime state. These checks do not sandbox trusted plugins or the
low-level execution API.

中文：项目入口按已有schema类型拒绝无效显式值与重复标识符，所有模式写盘前核最终合并输出。公开失败不回显私有原文；受信低层接口仍保留本地调试输出，第三方插件执行不是沙箱。

The runner validates the closed page/source/scheme selections, inventories `documentation-presentation-profile.json` and
`hia-page-map.json`, and leaves page partitioning, source assets, reader behavior and skin implementation to
`@mandolin/jsdoc-theme-hia`.

For JavaScript documentation source mapping, set `options.hia.docSourceMap.enabled` to `true` in the project config.
The runner requests the fixed `hia-doc-source-map.json` output next to `hia-integration.json` and adds a
`doc-source-map@1.1.0` producer artifact only when the same-build files pass closed structure, privacy, path and
symbol-reference validation. Invalid, missing or failed-build maps receive a public-safe diagnostic and are removed
from the output directory. With the option omitted or false, a prior map in a reused directory is cleared.

The current theme bridge declares documentation-presentation-profile 1.0.0. Artifact inventory reads the generated contract/version and requires an admitted exact identity paired with that bridge. Unreadable, unsupported or mismatched identities produce HIA_JSDOC_PRESENTATION_ARTIFACT_INVALID without a presentation entry; independent artifacts can remain in a partial producer result. This check does not validate the complete profile or authorize source disclosure. No new runtime dependency on the main monorepo is introduced.
