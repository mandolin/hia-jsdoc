/**
 * @file
 * @lang zh-CN 验证已声明公开入口及包内文档，不以槽位数量替代语义验收；私有标记为合成数据。
 * @lang en Checks declared public entries and package-local documentation without treating slot counts as semantic acceptance; private markers are synthetic.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import test from "node:test";
import {normalizeExtraPluginRegistry} from "../packages/jsdoc-extra-plugin-registry/src/index.mjs";
import {runHiaJsdocProject} from "../packages/jsdoc-runner/src/index.mjs";

// <lang><zh-CN>本仓根用于读取实际包内材料，不扫描业务项目。</zh-CN><en>Use this repository root for actual package-local materials, never business projects.</en></lang>
const root = fileURLToPath(new URL("..", import.meta.url));

test("rejected extra-plugin paths never enter public diagnostics", () => {
  for (const module of ["../SYNTHETIC_PRIVATE_MODULE", "C:\\SYNTHETIC_PRIVATE_MODULE\\plugin.cjs"]) {
    const registry = normalizeExtraPluginRegistry({before: [module]});
    assert.deepEqual(registry.before, []);
    assert.equal(registry.diagnostics[0].code, "HIA_JSDOC_PLUGIN_PATH_UNSAFE");
    assert.deepEqual(registry.diagnostics[0].data, {phase: "before", index: 0});
    assert.equal(JSON.stringify(registry.diagnostics).includes("SYNTHETIC_PRIVATE_MODULE"), false);
  }
});

test("registry keeps existing order, aliases, duplicates and option references", () => {
  const config = {choice: "kept"};
  const registry = normalizeExtraPluginRegistry({before: ["a", "a", {package: "b", config, optional: 1}], pre: ["ignored"], post: ["c"]});
  assert.deepEqual(registry.order, ["a", "a", "b", "hia-jsdoc-plugin", "c"]);
  assert.equal(registry.before[2].optional, true);
  assert.strictEqual(registry.before[2].config, config);
  assert.deepEqual(registry.diagnostics, []);
  assert.equal(normalizeExtraPluginRegistry({before: "bad"}).diagnostics[0].code, "HIA_JSDOC_PLUGIN_LIST_INVALID");
  assert.equal(normalizeExtraPluginRegistry({after: [{}]}).diagnostics[0].code, "HIA_JSDOC_PLUGIN_ENTRY_INVALID");
});

test("actual producer result does not republish a rejected module path", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "jsdoc-public-api-"));
  try {
    fs.writeFileSync(path.join(directory, "input.js"), "/** Synthetic input. */ function input() {}\n");
    fs.writeFileSync(path.join(directory, "noop.cjs"), 'exports.handlers = {};\n');
    const result = runHiaJsdocProject({workspaceRoot: directory, outputDirectory: path.join(directory, "out"), inputs: [{path: "input.js"}], options: {mode: "hiaIntegration", plugin: {pluginPath: path.join(directory, "noop.cjs")}, extraPlugins: {before: ["../SYNTHETIC_PRIVATE_MODULE"]}}});
    assert.ok(result.diagnostics.some((item) => item.code === "HIA_JSDOC_PLUGIN_PATH_UNSAFE"));
    assert.equal(JSON.stringify(result).includes("SYNTHETIC_PRIVATE_MODULE"), false);
  } finally {
    // <lang><zh-CN>仅清理本测试独占且已核真实父目录的临时根。</zh-CN><en>Clean only this test's owned temporary root after checking its physical parent.</en></lang>
    const actual = fs.realpathSync.native(directory);
    assert.equal(path.dirname(actual), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(actual).startsWith("jsdoc-public-api-"));
    fs.rmSync(actual, {recursive: true, force: true});
  }
});

for (const directory of fs.readdirSync(path.join(root, "packages"), {withFileTypes: true}).filter((entry) => entry.isDirectory())) {
  test(`package-local README inventories every actual root export: ${directory.name}`, async () => {
    // <lang><zh-CN>从安装目标入口取实际名字，README不允许只写泛化占位而漏掉公共常量或别名。</zh-CN><en>Read actual names from the installed target entry; README placeholders cannot omit public constants or aliases.</en></lang>
    const packageRoot = path.join(root, "packages", directory.name);
    const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
    const exports = await import(pathToFileURL(path.join(packageRoot, manifest.exports["."])));
    const readme = fs.readFileSync(path.join(packageRoot, "README.md"), "utf8");
    for (const name of Object.keys(exports)) assert.ok(readme.includes(`\`${name}\``), `${manifest.name}: ${name} missing from README`);
    assert.ok(readme.includes("Side effects"), `${manifest.name}: side effects missing`);
    assert.ok(readme.includes("Errors"), `${manifest.name}: errors missing`);
  });
}
