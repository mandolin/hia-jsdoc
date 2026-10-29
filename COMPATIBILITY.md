# Configuration and artifact compatibility

中文摘要：工具包、配置与工件分别版本化。当前配置/umbrella 1.0.0有精确旧读与显式配置迁移；Integration/页映射0.1.0是必要正式兼容profile，不能借旧数字排除保证。此文件不宣称任何未发布包可从npm安装。

| Surface | Current identity | Guarantee and boundary |
| --- | --- | --- |
| Project config | `schemaVersion: 1.0.0` | Exact `$schema` pairing when present; omission defaults documented in the runner; invalid explicit types rejected. Exact `0.1.0-draft` reading preserves original data and historical loader behavior. Explicit migration creates a detached current object or refuses loss. |
| Umbrella metadata | `hia-jsdoc-umbrella-config@1.0.0` | Current preset/version summary; identity-only reader preserves exact old/current objects. Nested plugin/theme/Portal content needs its actual owner validator. No implicit nested migration. |
| Integration | `hia-jsdoc-integration@0.1.0` | Existing plugin writer and main parser exact profile; preserves documented nodes, i18n and source references. Enabled sidecar inventory checks same-build symbol references. It is a required wire compatibility commitment, not an optional pre-stable output. |
| Theme page map | `jsdoc-theme-hia/page-map@0.1.0` | Existing theme writer maps topic IDs to generated relative page files, with `home`, `mode` and `pages`. Referenced pages must exist. Keep the owner profile's structure and behavior; no new version is inferred from package upgrades. |
| Documentation source map | `doc-source-map@1.1.0` | Existing opt-in, closed validation, paths/privacy, per-reference coordinates and paired Integration 0.1.0. Unsupported or unverifiable ranges are not upgraded to precise positions. Reference-helper `profileVersion` describes umbrella metadata, not this map's wire version. |
| Producer descriptor/result | `documentation-producer@1.0.0` / `documentation-producer-result@1.0.0` | Shared SDK owns current semantics and exact historical result reading. CLI exit zero with no artifacts is a failed build. |
| Presentation / UI locale | Current owner `1.0.0` | Existing exact owner pairing; no catalog/layout copies or automatic old-report relabeling. |

An incompatible Integration/page-map wire change needs a new wire identity and
coordinated writers/readers. Package SemVer and these wire identities are separate;
the 0.1.0 profiles remain part of the tool's compatibility obligation.

## Reading, migration and execution

`readHiaJsdocConfig()` validates versioned project input and returns the original
object. `loadHiaJsdocConfig()` also reads a local JSON file and constructs a runtime
request. Neither writes output or executes plugins. `migrateHiaJsdocConfig()`
preserves representable JSON extensions and omitted fields; it rejects lossy or
invalid inputs rather than deleting or coercing them. Callers persist new configs
explicitly. See the [runner API](packages/jsdoc-runner/README.md#versioned-project-configuration).

Actual builds still enforce the project output boundary and map/identity checks.
Trusted third-party JSDoc plugins are not sandboxed. Metadata-only identity
admission does not establish semantic validity, source disclosure permission,
visual acceptance or a successful deployment.
