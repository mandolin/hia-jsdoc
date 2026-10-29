# Release Checklist

- Run `npm run release:gate`.
- Regenerate fixture output with `npm run build:fixtures`.
- Confirm `npm pack --dry-run --json` output.
- Confirm generated fixture output does not contain local paths and no tarballs are committed.
- Confirm dependency and license review is up to date.

## Frozen source candidate setup

Current child package candidates and their first-party runtime dependencies are exact 1.0.0. The root workspace stays private. Check out the sibling owners at owner-sources.json commits, run npm run prepare:owners, then npm ci. Preparation does not install, rewrite manifests/locks or publish; it checks origin/HEAD/package/archive SHA/SRI and writes only ignored .owner-packages. See [MIGRATION.md](MIGRATION.md). Candidate/registry and visual/deployment qualification remain separate.

中文：源码候选的永久身份/依赖已协调；开发先准备固定owner归档再冻结安装，公开消费者不需要这套开发准备。实际发布/站点验收另验。
