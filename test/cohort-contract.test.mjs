/**
 * @file
 * @lang zh-CN 核八个必要包自己的许可证、已确认producer1.0.0写者和已发布依赖摘要；不将源码版本当registry发行。
 * @lang en Checks each required package's license, the confirmed producer 1.0.0 writer and published-dependency summaries without treating source versions as registry releases.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {jsdocProducerDescriptor} from "../packages/jsdoc-producer/src/index.mjs";
import {stagedJsdocProducerDescriptor} from "../packages/jsdoc-producer/src/staged.mjs";
import {runHiaJsdocProject} from "../packages/jsdoc-runner/src/index.mjs";
import {createHiaJsdocVersionSummary} from "../packages/jsdoc-spec/src/index.mjs";

// <lang><zh-CN>包范围来自本仓实际workspace目录，禁止用根许可证替代包内文件。</zh-CN><en>Derive package scope from actual workspace directories; a root license never substitutes for package-local files.</en></lang>
const root = fileURLToPath(new URL("..", import.meta.url));
const directories = fs.readdirSync(path.join(root, "packages"), {withFileTypes: true}).filter((entry) => entry.isDirectory());
assert.equal(directories.length, 8);
for (const directory of directories) {
  test(`required package carries its own MIT license: ${directory.name}`, () => {
    const packageRoot = path.join(root, "packages", directory.name);
    const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
    assert.equal(manifest.license, "MIT");
    // <lang><zh-CN>保留包自己的版权主体，不把已存在的Mandolin署名机械覆盖为根HIA署名。</zh-CN><en>Preserve package-specific copyright holders instead of mechanically replacing existing Mandolin attribution with the root HIA attribution.</en></lang>
    const license = fs.readFileSync(path.join(packageRoot, "LICENSE"), "utf8");
    assert.match(license, /^MIT License\r?\n/u);
    assert.match(license, /Copyright \(c\) 2026 (?:HIA|Mandolin)/u);
    assert.match(license, /Permission is hereby granted, free of charge/u);
  });
}

test("ordinary and staged descriptors adopt the confirmed SDK 1.0.0 contract", () => {
  for (const descriptor of [jsdocProducerDescriptor, stagedJsdocProducerDescriptor]) {
    assert.equal(descriptor.contract, "documentation-producer");
    assert.equal(descriptor.contractVersion, "1.0.0");
    assert.deepEqual(descriptor.capabilities, {sourceLinkage: true, incremental: false, watch: false});
  }
});

test("new failed results use the current identity without touching output", () => {
  // <lang><zh-CN>已中止请求验证writer身份；不运行JSDoc、不改保存的历史结果。</zh-CN><en>An aborted request tests writer identity without running JSDoc or modifying saved historical results.</en></lang>
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "hia-jsdoc-cohort-"));
  try {
    const outputDirectory = path.join(parent, "output");
    const result = runHiaJsdocProject({workspaceRoot: parent, outputDirectory, inputs: [{kind: "javascript-source", path: "input.js"}]}, {signal: {aborted: true}});
    assert.equal(result.contract, "documentation-producer-result");
    assert.equal(result.contractVersion, "1.0.0");
    assert.equal(result.status, "failed");
    assert.deepEqual(result.artifacts, []);
    assert.equal(result.diagnostics[0].code, "HIA_JSDOC_RUNNER_ABORTED");
    assert.equal(fs.existsSync(outputDirectory), false);
  } finally {
    // <lang><zh-CN>递归清理前核真实直属父与本测试前缀，只删除独占的合成目录。</zh-CN><en>Before recursive cleanup, verify the physical direct parent and test prefix, deleting only the owned synthetic directory.</en></lang>
    const realParent = fs.realpathSync.native(parent);
    assert.equal(path.dirname(realParent), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(realParent).startsWith("hia-jsdoc-cohort-"));
    fs.rmSync(realParent, {recursive: true, force: true});
  }
});

test("default dependency metadata stays aligned with the declared published edges", () => {
  const summary = createHiaJsdocVersionSummary();
  for (const [name, part] of [["jsdoc-plugin-hia-bridge", "plugin"], ["jsdoc-theme-bridge", "theme"]]) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "packages", name, "package.json"), "utf8"));
    assert.equal(summary[part].version, manifest.dependencies[summary[part].package]);
  }
});

test("an actual zero-output execution cannot claim SDK success", () => {
  // <lang><zh-CN>合成无操作插件与模板让真实JSDoc退出0但不产出工件；空success不符合已确认SDK规则。</zh-CN><en>Synthetic no-op plugin/template make real JSDoc exit zero without artifacts; empty success violates the confirmed SDK rule.</en></lang>
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "hia-jsdoc-cohort-"));
  try {
    fs.writeFileSync(path.join(parent, "input.js"), "/** Greets. @lang zh-CN 问候。 */\nfunction greet() {}\n");
    fs.writeFileSync(path.join(parent, "noop-plugin.cjs"), '"use strict"; exports.handlers = {};\n');
    fs.mkdirSync(path.join(parent, "template"));
    fs.writeFileSync(path.join(parent, "template/publish.js"), '"use strict"; exports.publish = function () {};\n');
    const result = runHiaJsdocProject({workspaceRoot: parent, outputDirectory: path.join(parent, "output"), inputs: [{kind: "javascript-source", path: "input.js"}], options: {mode: "standalone", plugin: {pluginPath: path.join(parent, "noop-plugin.cjs")}, theme: {template: path.join(parent, "template")}}});
    assert.equal(result.contractVersion, "1.0.0");
    assert.equal(result.status, "failed");
    assert.deepEqual(result.artifacts, []);
    assert.ok(result.diagnostics.some((item) => item.code === "HIA_JSDOC_OUTPUT_EMPTY" && item.severity === "error"));
  } finally {
    // <lang><zh-CN>只清理本次系统临时根直属目录，真实路径必须仍在同一边界。</zh-CN><en>Clean only this invocation's direct system-temporary child, whose physical path must remain within that boundary.</en></lang>
    const realParent = fs.realpathSync.native(parent);
    assert.equal(path.dirname(realParent), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(realParent).startsWith("hia-jsdoc-cohort-"));
    fs.rmSync(realParent, {recursive: true, force: true});
  }
});
