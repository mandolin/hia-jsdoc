/**
 * @file
 * @lang zh-CN 用隔离Git仓与合成包核固定归档准备、篡改/错误来源拒绝及无宿主清单改写。
 * @lang en Uses isolated Git repositories and synthetic packages to check pinned archive preparation, tampering/source refusal and unchanged host manifests.
 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {execFileSync} = require("node:child_process");
const test = require("node:test");
// <lang><zh-CN>候选实现首次缺失时测试明确失败，不将缺模块异常当拒绝态正控。</zh-CN><en>Missing candidate implementation fails explicitly, never counting a missing-module exception as a refusal control.</en></lang>
const helper = path.join(__dirname, "../scripts/prepare-owner-packages.cjs");
test("pinned archives reproduce, cache safely and reject drift without rewriting input", () => {
  assert.ok(fs.existsSync(helper), "Owner preparation implementation required.");
  const {prepareOwnerPackages, verifyOwnerLock} = require(helper);
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "jsdoc-owner-candidate-"));
  const root = path.join(base, "consumer");
  const owner = path.join(base, "fixture-owner");
  // <lang><zh-CN>git只操作本测试独占仓，origin仅写合成身份，不执行网络请求。</zh-CN><en>Git operates only on this test's owned repository; origin records synthetic identity without network requests.</en></lang>
  const git = (...args) => execFileSync("git", ["-C", owner, ...args], {encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]}).trim();
  const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
  try {
    fs.mkdirSync(root); fs.mkdirSync(owner);
    write(path.join(owner, "package.json"), {name: "@mandolin/fixture-owner", version: "1.0.0", license: "MIT", main: "index.cjs"});
    fs.writeFileSync(path.join(owner, "index.cjs"), 'module.exports="synthetic";\n');
    git("init", "-q"); git("config", "user.name", "Synthetic fixture"); git("config", "user.email", "fixture@example.invalid");
    git("remote", "add", "origin", "https://github.com/mandolin/fixture-owner.git"); git("add", "."); git("commit", "-qm", "synthetic owner");
    const commit = git("rev-parse", "HEAD");
    const entry = {name: "@mandolin/fixture-owner", repository: "fixture-owner", commit, version: "1.0.0", archive: "mandolin-fixture-owner-1.0.0.tgz"};
    write(path.join(root, "package.json"), {name: "synthetic-consumer", private: true, devDependencies: {[entry.name]: `file:.owner-packages/${entry.archive}`}});
    write(path.join(root, "owner-sources.json"), {owners: [entry]});
    const manifest = fs.readFileSync(path.join(root, "package.json"), "utf8");
    // <lang><zh-CN>仅内部测试/首次锁定可显式探测摘要；正常CLI必须已提供摘要，不自行更新来源表。</zh-CN><en>Only internal testing/initial locking explicitly discovers digests; the normal CLI requires existing digests and never updates its source table.</en></lang>
    const first = prepareOwnerPackages(root, {discoverIntegrity: true})[0];
    entry.integrity = first.integrity; entry.sha256 = first.sha256;
    write(path.join(root, "owner-sources.json"), {owners: [entry]});
    const pinned = fs.readFileSync(path.join(root, "owner-sources.json"), "utf8");
    assert.equal(prepareOwnerPackages(root)[0].reused, true);
    git("remote", "set-url", "origin", "https://github.com/mandolin/fixture-owner");
    assert.equal(prepareOwnerPackages(root)[0].reused, true);
    git("remote", "set-url", "origin", "https://github.com/mandolin/fixture-owner.git");
    const locked = {version: entry.version, resolved: `file:.owner-packages/${entry.archive}`, integrity: entry.integrity};
    write(path.join(root, "package-lock.json"), {packages: {[`node_modules/${entry.name}`]: locked}});
    assert.doesNotThrow(() => verifyOwnerLock(root));
    for (const patch of [{link: true}, {version: "0.1.0"}, {resolved: "https://example.invalid/owner.tgz"}, {integrity: "sha512-invalid"}]) {
      write(path.join(root, "package-lock.json"), {packages: {[`node_modules/${entry.name}`]: {...locked, ...patch}}});
      assert.throws(() => verifyOwnerLock(root), /lock/u);
    }
    assert.equal(fs.readFileSync(path.join(root, "package.json"), "utf8"), manifest);
    assert.equal(fs.readFileSync(path.join(root, "owner-sources.json"), "utf8"), pinned);
    git("remote", "set-url", "origin", "https://example.invalid/SYNTHETIC_PRIVATE");
    assert.throws(() => prepareOwnerPackages(root), (error) => !error.message.includes("SYNTHETIC_PRIVATE"));
    git("remote", "set-url", "origin", "https://github.com/mandolin/fixture-owner.git");
    const archive = path.join(root, ".owner-packages", entry.archive);
    fs.appendFileSync(archive, "corruption");
    assert.throws(() => prepareOwnerPackages(root), /integrity/u);
    assert.ok(fs.readFileSync(archive).subarray(-10).toString().endsWith("corruption"));
    entry.commit = "0".repeat(40); write(path.join(root, "owner-sources.json"), {owners: [entry]});
    assert.throws(() => prepareOwnerPackages(root), /checkout/u);
  } finally {
    const actual = fs.realpathSync.native(base);
    assert.equal(path.dirname(actual), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(actual).startsWith("jsdoc-owner-candidate-"));
    fs.rmSync(actual, {recursive: true, force: true});
  }
});
