# Changelog

- 中文：补齐八包实际导出/默认/错误/副作用与生成链参考并常驻检查；拒绝插件路径不再进入公开诊断data，保持code/phase/index及正常排序。
- English: Inventory actual exports/defaults/errors/effects and generation responsibilities in each package with permanent checks; rejected plugin paths no longer enter public diagnostic data, preserving codes, phases, indices and normal ordering.

- 中文：新增配置/umbrella 1.0.0、新旧精确读取和显式无损配置迁移；两份schema实际入包，旧schema保留原文。Integration/页映射保持0.1.0正式兼容profile，源码映射1.1.0不变。
- English: Add config/umbrella 1.0.0, exact versioned reading and explicit lossless config migration; ship both schemas while preserving the old schema source. Integration/page maps retain exact 0.1.0 compatibility profiles, with source-map 1.1.0 unchanged.

- 中文：八个必要子包均携带本包MIT许可证并由pack门禁强制核对；新普通/暂存生产器描述及结果采用已确认SDK1.0.0，历史结果不改号。
- English: All eight required child packages carry their own MIT license enforced by the pack gate; new ordinary/staged producer descriptors and results adopt the confirmed SDK 1.0.0 without relabeling historical results.

- 中文：项目运行器在所有模式写盘前核baseConfig最终输出，执行已有选项类型与唯一标识符规则；公开失败不回显原始JSDoc/配置/路径，暂存复制排除私有运行配置。
- English: Project runs validate effective baseConfig outputs before writes in every mode, enforce declared option types and unique identifiers, keep raw JSDoc/config/path data out of public failures, and exclude private runtime configuration from staged copies.

- 中文：干净CI显式检出并精确固定自文档化/来源测试所需的插件与主题owner，补运行目录及引用防漂移测试。
- English: Clean CI explicitly checks out and pins plugin/theme owners required by self-documentation and provenance tests, with working-directory and reference drift checks.

## Unreleased — Supported runtime baseline

- 源清单、锁与本地/CI运行基线对齐Node.js 22.23.4和24.22.1，两平台门禁及拒绝漂移检查同步；旧已发布工件不改写，本次不发布npm。
- Align current source, locks and local/CI runtime floors on Node.js 22/24, with Windows/Ubuntu checks and drift rejection. Existing published archives remain separate; no npm release is announced.


## Unreleased — Optional JSDoc documentation source map

- Add an opt-in standalone `doc-source-map@1.1.0` sidecar to the project runner and staged producer.
- Validate the fixed sidecar's structure, privacy, paths and symbol references before inventory; clear stale or rejected maps from reused output directories.
- Reject enabled map configurations that redirect their paired integration output or destination outside the current build.

## Unreleased — Presentation identity pairing

- Theme bridge/spec declare exact presentation profile 1.0.0. The runner reads the generated identity and pairs it with its bridge instead of hard-coding a legacy inventory version.
- Unreadable, unsupported or mismatched identities yield HIA_JSDOC_PRESENTATION_ARTIFACT_INVALID without a presentation inventory entry or private error echo. Other artifacts can remain in a partial result. This is an identity check, not full profile validation; package versions and published archives are unchanged.

## Unreleased

- Add HIA JSDoc config schema, `hia-jsdoc` CLI and project producer result surface.
- Add `@hia-doc/jsdoc-producer` as the thin documentation producer adapter.
- Add standalone and first-party self-doc smoke fixtures using canonical `@lang`.

## 0.0.0

- Initialize HIA JSDoc bootstrap workspace.
- Add W-P9.5 umbrella preset, runner, published JPHS/JTH bridge dependencies, extra plugin registry, fixture generation and license audit.
