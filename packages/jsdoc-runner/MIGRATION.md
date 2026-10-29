# Moving to the 1.0.0 source candidates

中文摘要：八个umbrella包及独立插件/主题均协调为1.0.0源码候选，公开runtime依赖精确1.0.0。源码开发根保持private，使用固定Git提交的file tarball开发依赖与冻结锁；公开消费者无需这套准备。实际npm发布、站点/视觉验收及目标采用分别核验。

## Versions and previous inputs

Package versions, runner/producer tool versions and plugin/theme dependency
metadata now identify 1.0.0. Published 0.x archives remain unchanged. Root imports,
staged producer, two schema JSON subpaths and hia-jsdoc CLI remain available.
Previously private child packages are now public-package source candidates with
explicit package files, MIT license and public access metadata; the workspace
root remains private and is not a distribution package.

Config/umbrella use 1.0.0, with exact old 0.1.0-draft reading and explicit
migrateHiaJsdocConfig. Migration creates a detached object or refuses data loss;
it does not rewrite files. Integration and page-map retain their exact 0.1.0
compatibility profiles, documentation source maps remain 1.1.0, and shared
producer/presentation/UI-locale identities remain 1.0.0. Never relabel old wire
objects solely to match the package version.

Project execution enforces effective output boundaries, declared input types,
unique profile IDs and public failure summaries. Rejected plugin-path diagnostics
omit the original path; hook summaries omit thrown messages while explicit local
throwOnError preserves the original value. Code parsing those old raw diagnostic
suffixes must use stable codes and admitted metadata instead. Empty output cannot
be SDK success; staged copying excludes new private runtime configs and remains
additive. Trusted plugin execution/raw local errors are not sandboxed or
automatically safe for publication.

See package README references for complete names/defaults/errors/effects and the
public [API inventory](https://github.com/mandolin/hia-jsdoc/blob/main/API.md).
Use Node.js ^22.23.4 or ^24.22.1 with tested JSDoc 4.0.5. Earlier runtime versions
and future upstream parser versions are not inferred compatible.

## Frozen source development before registry publication

Place this source checkout beside jsdoc-plugin-hia-sys and jsdoc-theme-hia at the
exact commits in owner-sources.json. Run `npm run prepare:owners`, then `npm ci`.
Preparation uses existing Git/tar/local npm, disables lifecycle scripts, and
writes only ignored .owner-packages in this repository. It checks exact origin,
HEAD, package identity and prelocked SHA/SRI. It never fetches/checks out owners,
rewrites their manifests or fixes the lock silently. Wrong checkouts and corrupt
caches are rejected. The two exact HTTPS origin forms with/without .git work.

Only this private development root uses file-tarball devDependencies. All shipped
first-party runtime edges are exact ordinary 1.0.0 dependencies. Original candidate
tarballs can be consumed together without editing their manifests. Until actual
publication is verified, do not assume npm registry installation of 1.0.0 exists.
Publishing/provenance, dist-tags and a clean site deployment remain separate
release decisions; source qualification does not perform them.
