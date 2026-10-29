# Public package and generation responsibilities

中文摘要：八个umbrella包和独立JSDoc插件/主题共同组成十包责任面。根导出、JSON子路径、CLI与已导出的CommonJS嵌套对象均在清单中；包版本、wire版本和实际npm发行分别核对。

| Package | Public reference and role |
| --- | --- |
| @hia-doc/jsdoc-spec | [Constants and metadata builders](packages/jsdoc-spec/README.md#complete-public-api), including exact umbrella identity reading and owner-neutral Portal capability. |
| @hia-doc/jsdoc-extra-plugin-registry | [Ordered extra-plugin declarations](packages/jsdoc-extra-plugin-registry/README.md#public-api), aliases, warning codes and trusted-local limits. |
| @hia-doc/jsdoc-plugin-hia-bridge | [Plugin descriptor/path helpers](packages/jsdoc-plugin-hia-bridge/README.md#public-api); no source implementation copy or automatic install. |
| @hia-doc/jsdoc-theme-bridge | [Template/presentation helpers](packages/jsdoc-theme-bridge/README.md#public-api), delegating skins and actual rendering. |
| @hia-doc/jsdoc-preset | [Config construction and shallow merge](packages/jsdoc-preset/README.md#public-api), distinct from project execution validation. |
| @hia-doc/jsdoc-doc-source-map | [Metadata reference helper](packages/jsdoc-doc-source-map/README.md#public-api), not a map producer or source precision proof. |
| @hia-doc/jsdoc-runner | [Versioned config](packages/jsdoc-runner/README.md#versioned-project-configuration), [all exports/CLI](packages/jsdoc-runner/README.md#complete-export-and-cli-inventory) and execution-time boundaries. |
| @hia-doc/jsdoc-producer | [Root and staged adapters](packages/jsdoc-producer/README.md#public-api), SDK results and additive staging-copy effects. |
| @mandolin/jsdoc-plugin-hia-sys | [Plugin-owned API](https://github.com/mandolin/jsdoc-plugin-hia-sys/blob/main/API.md), standard lifecycle callbacks plus exported nested helpers/state. |
| @mandolin/jsdoc-theme-hia | [Template-owned API](https://github.com/mandolin/jsdoc-theme-hia/blob/main/API.md), synchronous publish callback and output files. |

## Generation continuity

Canonical comment fields enter plugin doclet metadata and Integration i18n; the
shared parser converts that payload to the core document consumed by Portal.
Plugin source metadata and opt-in doc-source-map 1.1.0 retain verified ranges and
unverified states. The theme owns partition/topic/page/source assets and their
map/profile, while the producer inventories same-build artifacts. Helper metadata
does not establish source consent, cross-map precision, or visual acceptance.
See [wire compatibility](COMPATIBILITY.md) for exact current and historical IDs.

Registry path checks and project output checks are local boundaries, not a
sandbox for user plugins. Raw config, low-level process output, extension state,
custom diagnostics and source bodies may be private. Rejected registry paths and
generated hook-error summaries omit the original rejected path/thrown message;
this does not automatically sanitize arbitrary caller-supplied diagnostics.

The release API list includes names, defaults, ownership, errors and side effects
in each package's shipped reference. Automated name/doc checks guard omissions;
they complement real generation/install/semantic tests and do not alone qualify
the packages for 1.0.0 publication. JSDoc compatibility is tested with 4.0.5;
the broader peer range is not proof of all future upstream versions.
