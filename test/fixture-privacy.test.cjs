/**
 * @file
 * @lang zh-CN 公开品牌与真实私有路径分别验收，保留跨平台和转义反例。
 * @lang en Verify public branding separately from actual private paths, retaining cross-platform and escaped counterexamples.
 */
const assert = require("node:assert/strict");
const test = require("node:test");
const {hasFixtureLocalPathLeakage} = require("../scripts/fixture-privacy.cjs");

for (const value of ["HIA-Documentation-Sys · hia-jsdoc", "https://mandolin.github.io/HIA-Documentation/", "packages/jsdoc-runner/src/cli.mjs", JSON.stringify("Generated help\\n\\nUsage\\n"), JSON.stringify("HIA-Documentation-Sys · hia-jsdoc") ]) {
  test("public branding or package-relative reference " + value, () => assert.equal(hasFixtureLocalPathLeakage(value), false));
}
for (const value of ["K:\\Project\\HIA-Documentation-Sys", "D:/other/project", "Github_mandolin", "work-zone/private", "ai/codex/private", "ai\\codex\\private", "file:///C:/private", "\\\\host\\share", "HIA-Documentation-Sys/work-zone/private", "K%3A%5CProject", "work%252dzone/private", "K\\u003a\\u005cProject"]) {
  test("private path or escaped path is rejected " + JSON.stringify(value), () => assert.equal(hasFixtureLocalPathLeakage(value), true));
}
