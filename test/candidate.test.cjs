/**
 * @file
 * @lang zh-CN 核八个首版包的永久身份、公开分发、依赖/默认元数据与冻结来源，不执行实际发布。
 * @lang en Checks permanent identities, public distribution, dependency/default metadata and frozen sources for eight first-release packages without publishing.
 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const root = path.resolve(__dirname, "..");
const json = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

for (const directory of fs.readdirSync(path.join(root, "packages"), {withFileTypes: true}).filter((item) => item.isDirectory())) {
  test(`permanent candidate identity and public dependencies: ${directory.name}`, () => {
    const manifest = json(`packages/${directory.name}/package.json`);
    assert.equal(manifest.version, "1.0.0");
    assert.equal(manifest.private, false);
    assert.equal(manifest.publishConfig.access, "public");
    for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
      if (name.startsWith("@hia-doc/") || name.startsWith("@mandolin/")) assert.equal(version, "1.0.0");
    }
  });
}
test("private development sources are explicit file archives with pinned identities", () => {
  assert.equal(json("package.json").private, true);
  const sources = json("owner-sources.json");
  assert.equal(sources.owners.length, 2);
  for (const owner of sources.owners) {
    assert.equal(owner.version, "1.0.0");
    assert.match(owner.commit, /^[a-f0-9]{40}$/u);
    assert.match(owner.integrity, /^sha512-[A-Za-z0-9+/]+=*$/u);
    assert.equal(json("package.json").devDependencies[owner.name], `file:.owner-packages/${owner.archive}`);
  }
});
test("runtime candidate metadata agrees with permanent package dependencies", async () => {
  const spec = await import("../packages/jsdoc-spec/src/index.mjs");
  const runner = await import("../packages/jsdoc-runner/src/index.mjs");
  assert.equal(spec.createHiaJsdocVersionSummary().plugin.version, "1.0.0");
  assert.equal(spec.createHiaJsdocVersionSummary().theme.version, "1.0.0");
  assert.equal(runner.HIA_JSDOC_RUNNER_VERSION, "1.0.0");
});
