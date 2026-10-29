/**
 * @file
 * @lang zh-CN 用实际公开入口验证配置准入、最终输出与公开失败边界；只操作本测试的合成目录，不加载业务项目。
 * @lang en Exercises public config, effective output and public failure boundaries using synthetic test directories only, never business projects.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {HIA_JSDOC_CONFIG_SCHEMA_VERSION, loadHiaJsdocConfig, runHiaJsdocProject} from "../packages/jsdoc-runner/src/index.mjs";
import {stagedJsdocProducer} from "../packages/jsdoc-producer/src/staged.mjs";

// <lang><zh-CN>标记是合成私有输入，不含凭据；公开结果不能回显该值。</zh-CN><en>The marker is synthetic private input without credentials; public results must never echo it.</en></lang>
const marker = "SYNTHETIC_PRIVATE_BOUNDARY_MARKER";
const repository = fileURLToPath(new URL("..", import.meta.url));
const cli = path.join(repository, "packages/jsdoc-runner/src/cli.mjs");

/**
 * @lang zh-CN 创建独占的工作区和无源码泄漏风险的文本，结束时仅清理已核真实边界的目录。
 * @lang en Creates an owned workspace with synthetic text and cleans only its verified physical directory.
 * @param {function(object):void} action <lang><zh-CN>同步断言回调；不能保留临时路径。</zh-CN><en>Synchronous assertions that must not retain temporary paths.</en></lang>
 * @returns {void} <lang><zh-CN>无业务仓副作用。</zh-CN><en>No business repository side effects.</en></lang>
 */
function withFixture(action) {
  // <lang><zh-CN>父目录为系统临时根的唯一直属子目录；每个测试独占生命周期。</zh-CN><en>The parent is a unique direct child of the system temporary root, owned by this test's lifetime.</en></lang>
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "hia-jsdoc-project-boundary-"));
  const workspaceRoot = path.join(parent, "workspace");
  const outputDirectory = path.join(workspaceRoot, "output");
  fs.mkdirSync(path.join(workspaceRoot, "src"), {recursive: true});
  fs.writeFileSync(path.join(workspaceRoot, "src/greet.js"), "/** Greets a visitor. @lang zh-CN 问候访问者。 */\nfunction greet() {}\n");
  try {
    action({parent, workspaceRoot, outputDirectory});
  } finally {
    // <lang><zh-CN>递归清理前核真实路径、直属父和固定前缀，不接受目录联接造成的越界。</zh-CN><en>Before recursive cleanup, verify the physical path, direct parent and fixed prefix, rejecting junction-based escape.</en></lang>
    const realParent = fs.realpathSync.native(parent);
    assert.equal(path.dirname(realParent), fs.realpathSync.native(os.tmpdir()));
    assert.ok(path.basename(realParent).startsWith("hia-jsdoc-project-boundary-"));
    fs.rmSync(realParent, {recursive: true, force: true});
  }
}

/** @lang zh-CN 只写本测试JSON并调用公开loader，不执行JSDoc。 @lang en Writes only this test's JSON and calls the public loader without executing JSDoc. */
function loadFixture(fixture, patch = {}) {
  // <lang><zh-CN>使用现有身份与显式必需目录；本批不改变旧schema的required/default争议。</zh-CN><en>Use the existing identity and explicit required directories; this batch does not change the old schema's required/default conflict.</en></lang>
  const config = {schemaVersion: HIA_JSDOC_CONFIG_SCHEMA_VERSION, workspaceRoot: ".", outputDirectory: "output", inputs: [{kind: "javascript-source", path: "src"}], ...patch};
  const configPath = path.join(fixture.workspaceRoot, "hia.config.json");
  fs.writeFileSync(configPath, JSON.stringify(config));
  return loadHiaJsdocConfig(configPath);
}

/** @lang zh-CN 已声明标量/对象类型不可被null缺省或真值转换绕过。 @lang en Declared scalar/object types must not be bypassed through null defaults or truthy coercion. */
const invalidOptions = [
  ["options-null", null], ["mode-null", {mode: null}], ["mode-unknown", {mode: marker}],
  ["include-number", {includePattern: 3}], ["include-empty", {includePattern: ""}], ["exclude-array", {excludePattern: []}],
  ["recurse-string", {recurse: "false"}], ["recurse-null", {recurse: null}],
  ["manifest-string", {writeResultManifest: "false"}], ["manifest-null", {writeResultManifest: null}],
  ["content-null", {sourcesContentPolicy: null}], ["content-unknown", {sourcesContentPolicy: marker}],
  ...["extraPlugins", "plugin", "theme", "baseConfig", "hia"].flatMap((field) => [[`${field}-array`, {[field]: []}], [`${field}-null`, {[field]: null}]]),
  ["presentation-null", {hia: {presentation: null}}], ["presentation-array", {hia: {presentation: []}}],
  ["theme-selection-null", {hia: {theme: null}}], ["theme-selection-array", {hia: {theme: []}}]
];
for (const [name, options] of invalidOptions) {
  test(`loader rejects declared invalid option: ${name}`, () => withFixture((fixture) => {
    assert.throws(() => loadFixture(fixture, {options}), TypeError);
    assert.equal(fs.existsSync(fixture.outputDirectory), false);
  }));
}

/** @lang zh-CN 错误输入可用于诊断选择，但不得成为公开错误正文。 @lang en Invalid inputs may select diagnostics but must never become public error text. */
const privateConfigs = [
  ["unknown-key", {[marker]: true}], ["input-kind", {inputs: [{kind: marker, path: "src"}]}],
  ["content-policy", {options: {sourcesContentPolicy: marker}}], ["page-mode", {options: {hia: {presentation: {pageMode: marker}}}}],
  ["source-mode", {options: {hia: {presentation: {sourceMode: marker}}}}], ["scheme", {options: {hia: {theme: {scheme: marker}}}}]
];
for (const [name, patch] of privateConfigs) {
  test(`loader errors omit private input: ${name}`, () => withFixture((fixture) => {
    assert.throws(() => loadFixture(fixture, patch), (error) => error instanceof TypeError && !error.message.includes(marker));
  }));
}

test("loader read and JSON errors omit private paths and content", () => withFixture((fixture) => {
  assert.throws(() => loadHiaJsdocConfig(path.join(fixture.parent, marker)), (error) => !error.message.includes(marker) && !error.message.includes(fixture.parent));
  const configPath = path.join(fixture.workspaceRoot, "malformed.json");
  fs.writeFileSync(configPath, `${marker} malformed`);
  assert.throws(() => loadHiaJsdocConfig(configPath), (error) => error instanceof SyntaxError && !error.message.includes(marker));
}));

test("loader rejects duplicate profile identifiers declared unique by schema", () => withFixture((fixture) => {
  assert.throws(() => loadFixture(fixture, {profileIds: ["jsdoc", "jsdoc"]}), TypeError);
}));

/** @lang zh-CN 用已中止上下文核写前拒绝；旧实现不会真的执行越界JSDoc。 @lang en Uses an already-aborted context to test pre-write rejection without actually executing redirected JSDoc in the old implementation. */
const redirects = [
  ["outside-destination", (f) => ({opts: {destination: path.join(f.parent, "outside")}})],
  ["other-build-destination", () => ({opts: {destination: "other-build"}})],
  ["invalid-destination", () => ({opts: {destination: {private: marker}}})],
  ["outside-integration", (f) => ({opts: {hia: {integration: {enabled: true, outputFile: path.join(f.parent, "outside.json")}}}})],
  ["other-build-integration", () => ({opts: {hia: {integration: {enabled: true, outputFile: "other-build.json"}}}})]
];
for (const [name, override] of redirects) {
  test(`project rejects effective output redirect before writes: ${name}`, () => withFixture((fixture) => {
    assert.throws(() => runHiaJsdocProject({workspaceRoot: fixture.workspaceRoot, outputDirectory: fixture.outputDirectory, inputs: [{kind: "javascript-source", path: "src"}], options: {baseConfig: override(fixture)}}, {signal: {aborted: true}}), TypeError);
    assert.equal(fs.existsSync(fixture.outputDirectory), false);
    assert.equal(fs.existsSync(path.join(fixture.parent, "outside")), false);
    assert.equal(fs.existsSync(path.join(fixture.parent, "outside.json")), false);
  }));
}

test("valid defaults, explicit false, extensions and non-output overrides remain accepted", () => withFixture((fixture) => {
  const request = loadFixture(fixture, {options: {mode: "hiaIntegration", recurse: false, writeResultManifest: false, sourcesContentPolicy: "reference", baseConfig: {tags: {allowUnknownTags: true}}, hia: {theme: {customExtension: 1}}}});
  assert.equal(request.options.recurse, false);
  assert.equal(request.options.writeResultManifest, false);
  assert.equal(request.options.hia.theme.customExtension, 1);
  const result = runHiaJsdocProject(request, {signal: {aborted: true}});
  assert.equal(result.status, "failed");
  assert.equal(result.diagnostics[0].code, "HIA_JSDOC_RUNNER_ABORTED");
  assert.equal(fs.existsSync(fixture.outputDirectory), false);
  assert.equal(loadFixture(fixture).options.sourcesContentPolicy, "none");
}));

test("disabled integration does not interpret its unused output path", () => withFixture((fixture) => {
  const request = loadFixture(fixture, {options: {baseConfig: {opts: {hia: {integration: {enabled: false, outputFile: path.join(fixture.parent, marker)}}}}}});
  assert.equal(runHiaJsdocProject(request, {signal: {aborted: true}}).status, "failed");
  assert.equal(fs.existsSync(fixture.outputDirectory), false);
}));

test("equivalent final output paths remain accepted without a map", () => withFixture((fixture) => {
  const request = loadFixture(fixture, {options: {baseConfig: {opts: {destination: fixture.outputDirectory, hia: {integration: {enabled: true, outputFile: path.join(fixture.outputDirectory, "hia-integration.json")}}}}}});
  assert.equal(runHiaJsdocProject(request, {signal: {aborted: true}}).status, "failed");
  assert.equal(fs.existsSync(fixture.outputDirectory), false);
}));

test("staged producer copies artifacts without its private generated configuration", () => withFixture((fixture) => {
  // <lang><zh-CN>显式选本轮受信插件源码；本地运行配置可含路径/私有扩展，但不是交付工件。</zh-CN><en>Explicitly select this cohort's trusted plugin source; local runtime configuration may contain paths/private extensions but is not a delivery artifact.</en></lang>
  const request = loadFixture(fixture, {options: {mode: "hiaIntegration", plugin: {pluginPath: path.resolve(repository, "../jsdoc-plugin-hia-sys/src/index.cjs")}, baseConfig: {localOnlySetting: marker}}});
  const outputDirectory = path.join(fixture.parent, "consumer-output");
  const result = stagedJsdocProducer.produce({...request, outputDirectory});
  assert.equal(result.status, "success", JSON.stringify(result.diagnostics));
  assert.equal(fs.existsSync(path.join(outputDirectory, "hia-integration.json")), true);
  assert.equal(fs.existsSync(path.join(outputDirectory, ".hia-jsdoc")), false);
}));

test("public producer and written manifest never serialize raw JSDoc failure output", () => withFixture((fixture) => {
  // <lang><zh-CN>不存在的合成插件使真实CLI失败；不会加载任意第三方代码。</zh-CN><en>A missing synthetic plugin makes the real CLI fail without loading arbitrary third-party code.</en></lang>
  const request = loadFixture(fixture, {options: {plugin: {pluginPath: marker}, theme: {enabled: false}}});
  const result = runHiaJsdocProject(request);
  assert.equal(result.status, "failed");
  assert.equal(result.diagnostics[0].code, "HIA_JSDOC_RUNNER_FAILED");
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(marker), false);
  assert.equal(serialized.includes(fixture.workspaceRoot), false);
  const manifest = fs.readFileSync(path.join(fixture.outputDirectory, "hia-jsdoc.producer-result.json"), "utf8");
  assert.equal(manifest.includes(marker), false);
  assert.equal(manifest.includes(fixture.workspaceRoot), false);
}));

for (const [name, args] of [["unknown-option", [`--${marker}`]], ["missing-config", ["--config", marker]], ["invalid-mode", ["--mode", marker, "src"]]]) {
  test(`CLI rejects safely without a raw exception: ${name}`, () => withFixture((fixture) => {
    const child = spawnSync(process.execPath, [cli, ...args], {cwd: fixture.workspaceRoot, encoding: "utf8", shell: false});
    assert.equal(child.status, 1);
    assert.equal(child.stderr.includes(marker), false);
    assert.equal(child.stderr.includes(fixture.workspaceRoot), false);
    assert.equal(child.stderr.includes("\n    at "), false);
    assert.match(child.stderr, /HIA JSDoc failed:/u);
    assert.equal(fs.existsSync(fixture.outputDirectory), false);
  }));
}
