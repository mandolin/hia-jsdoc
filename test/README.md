# Tests

Run `npm run release:gate` on the supported Node.js versions from the workspace
root. Source-cohort tests use the pinned sibling plugin and theme repositories
documented in the root README and CI workflow.

`project-boundary.test.mjs` covers declared config types, private-input error
handling, effective output rejection before writes, real CLI failures and the
staged producer's private-config exclusion. It uses synthetic temporary
workspaces, including an already-aborted context for redirect counterexamples,
so an old implementation never executes redirected output. Cleanup checks the
physical directory boundary before removal.

中文：完整门禁与精确相邻源码配置见根文档；边界测试仅使用合成独占目录，越界反例在已中止上下文验证写前拒绝，不运行真实越界构建。
