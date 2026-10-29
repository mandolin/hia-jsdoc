/**
 * @file
 * @lang zh-CN 固定配置1.0.0、新旧精确读取及无损显式迁移；合成输入不代表真实历史采用。
 * @lang en Pins config 1.0.0, exact versioned reading and lossless explicit migration; synthetic inputs do not establish historical adoption.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import * as runner from "../packages/jsdoc-runner/src/index.mjs";
import * as spec from "../packages/jsdoc-spec/src/index.mjs";
import {createHiaJsdocConfig} from "../packages/jsdoc-preset/src/index.mjs";

// <lang><zh-CN>精确历史身份来自提交前schema，不随当前常量漂移。</zh-CN><en>The exact historical identity comes from the pre-change schema, independently of current constants.</en></lang>
const oldVersion = "0.1.0-draft";
const oldId = "https://mandolin.github.io/HIA-Documentation/schemas/hia-jsdoc-config-0.1.0-draft.schema.json";
const newId = oldId.replace(oldVersion, "1.0.0");
const root = fileURLToPath(new URL("..", import.meta.url));

test("current config and umbrella writers use 1.0.0 without changing wire dependencies", () => {
  assert.equal(runner.HIA_JSDOC_CONFIG_SCHEMA_VERSION, "1.0.0");
  assert.equal(runner.HIA_JSDOC_CONFIG_SCHEMA_ID, newId);
  const umbrella = createHiaJsdocConfig().opts.hia.umbrella;
  assert.equal(umbrella.contractVersion, "1.0.0");
  assert.equal(umbrella.versions.contractVersion, "1.0.0");
  assert.equal(umbrella.versions.plugin.version, "0.1.0");
  assert.equal(umbrella.versions.theme.version, "0.1.0");
});

test("versioned schemas preserve old required lists and expose new omission defaults", () => {
  const legacy = runner.getHiaJsdocConfigSchema(oldVersion);
  const current = runner.getHiaJsdocConfigSchema();
  assert.equal(legacy.$id, oldId);
  assert.deepEqual(legacy.required, ["schemaVersion", "workspaceRoot", "outputDirectory", "inputs"]);
  assert.deepEqual(legacy.properties.inputs.items.required, ["kind", "path"]);
  assert.deepEqual(current.required, ["schemaVersion", "inputs"]);
  assert.deepEqual(current.properties.inputs.items.required, ["path"]);
  assert.equal(current.properties.workspaceRoot.default, ".");
  assert.equal(current.properties.outputDirectory.default, "dist/hia-jsdoc");
  assert.equal(Object.hasOwn(current.properties.inputs.items.properties.path, "default"), false);
  assert.equal(Object.hasOwn(legacy.properties.workspaceRoot, "default"), false);
  assert.throws(() => runner.getHiaJsdocConfigSchema("1.0.1"), TypeError);
});

for (const version of [oldVersion, "1.0.0"]) {
  test(`exact ${version} reader preserves identity and fills defaults only in runtime requests`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "jsdoc-config-version-"));
    try {
      // <lang><zh-CN>旧loader原已接受缺省目录/kind；schema历史required不被该行为改写。</zh-CN><en>The old loader already accepted omitted directories/kind; that behavior does not rewrite historical schema requirements.</en></lang>
      const input = {schemaVersion: version, inputs: [{path: "src/main.mjs"}, {path: "src/main.js"}]};
      const snapshot = JSON.stringify(input);
      assert.strictEqual(runner.readHiaJsdocConfig(input), input);
      assert.equal(JSON.stringify(input), snapshot);
      const file = path.join(directory, "hia.json");
      fs.writeFileSync(file, snapshot);
      const request = runner.loadHiaJsdocConfig(file);
      assert.equal(request.workspaceRoot, directory);
      assert.equal(request.outputDirectory, path.join(directory, "dist/hia-jsdoc"));
      assert.deepEqual(request.inputs.map((item) => item.kind), ["javascript-module", "javascript-source"]);
      assert.equal(fs.existsSync(request.outputDirectory), false);
      assert.equal(fs.readFileSync(file, "utf8"), snapshot);
    } finally {
      // <lang><zh-CN>仅清理本测试独占临时目录，绝不触及目标项目。</zh-CN><en>Clean only this test's owned temporary directory, never a target project.</en></lang>
      const actual = fs.realpathSync.native(directory);
      assert.equal(path.dirname(actual), fs.realpathSync.native(os.tmpdir()));
      assert.ok(path.basename(actual).startsWith("jsdoc-config-version-"));
      fs.rmSync(actual, {recursive: true, force: true});
    }
  });
}

test("exact readers reject crossed and unknown identities without echoing private input", () => {
  for (const [version, id] of [[oldVersion, newId], ["1.0.0", oldId], ["1.0.1", newId], ["SYNTHETIC_PRIVATE", oldId]]) {
    assert.throws(() => runner.readHiaJsdocConfig({schemaVersion: version, $schema: id, inputs: [{path: "src"}]}), (error) => error instanceof TypeError && !error.message.includes("SYNTHETIC_PRIVATE"));
  }
});

test("new explicit null directories, kind and profileIds never turn into defaults", () => {
  const cases = [{workspaceRoot: null}, {outputDirectory: null}, {profileIds: null}, {inputs: [{kind: null, path: "src"}]}];
  for (const patch of cases) {
    assert.throws(() => runner.readHiaJsdocConfig({schemaVersion: "1.0.0", inputs: [{path: "src"}], ...patch}), TypeError);
  }
});

test("legacy null defaults remain readable but cannot migrate by silent coercion", () => {
  for (const patch of [{workspaceRoot: null}, {outputDirectory: null}, {profileIds: null}, {inputs: [{kind: null, path: "src"}]}]) {
    const legacy = {schemaVersion: oldVersion, inputs: [{path: "src"}], ...patch};
    assert.strictEqual(runner.readHiaJsdocConfig(legacy), legacy);
    assert.throws(() => runner.migrateHiaJsdocConfig(legacy), TypeError);
    assert.equal(legacy.schemaVersion, oldVersion);
  }
});

test("explicit migration preserves JSON extensions and omission with a detached result", () => {
  const legacy = JSON.parse('{"$schema":"'+oldId+'","schemaVersion":"'+oldVersion+'","inputs":[{"path":"src/main.mjs"}],"options":{"custom":{"__proto__":{"safe":true},"nested":[1,false,null]},"hia":{"custom":{"label":"保留 / preserved"}}}}');
  const snapshot = structuredClone(legacy);
  const migrated = runner.migrateHiaJsdocConfig(legacy);
  assert.deepEqual(migrated, {...snapshot, $schema: newId, schemaVersion: "1.0.0"});
  assert.deepEqual(legacy, snapshot);
  assert.notStrictEqual(migrated.options.custom, legacy.options.custom);
  assert.equal(Object.hasOwn(migrated, "workspaceRoot"), false);
  assert.equal(Object.hasOwn(migrated.inputs[0], "kind"), false);
  assert.equal(Object.prototype.safe, undefined);
  assert.strictEqual(runner.readHiaJsdocConfig(migrated), migrated);
  const currentCopy = runner.migrateHiaJsdocConfig(migrated);
  assert.deepEqual(currentCopy, migrated);
  assert.notStrictEqual(currentCopy, migrated);
  const numeric = runner.migrateHiaJsdocConfig({schemaVersion: oldVersion, inputs: [{path: "src"}], options: {extension: -0}});
  assert.ok(Object.is(numeric.options.extension, -0));
});

test("migration refuses lossy non-JSON extension values with fixed public errors", () => {
  const cycle = {}; cycle.self = cycle;
  for (const value of [undefined, NaN, Infinity, 1n, () => "SYNTHETIC_PRIVATE", new Date(), cycle, [1, , 3], {[Symbol("SYNTHETIC_PRIVATE")]: 1}]) {
    const legacy = {schemaVersion: oldVersion, inputs: [{path: "src"}], options: {extension: value}};
    assert.throws(() => runner.migrateHiaJsdocConfig(legacy), (error) => error instanceof TypeError && !error.message.includes("SYNTHETIC_PRIVATE"));
  }
});

test("migration rejects unknown fields and malformed semantics instead of dropping them", () => {
  for (const patch of [{unknown: "SYNTHETIC_PRIVATE"}, {inputs: [{path: "../private"}]}, {options: {recurse: "yes"}}, {options: {hia: {presentation: {sourceMode: "unknown"}}}}]) {
    assert.throws(() => runner.migrateHiaJsdocConfig({schemaVersion: oldVersion, inputs: [{path: "src"}], ...patch}), TypeError);
  }
});

test("migration never invokes accessors and preserves shared JSON values independently", () => {
  let invoked = false;
  const extension = Object.defineProperty({}, "secret", {enumerable: true, get() {invoked = true; return "SYNTHETIC_PRIVATE";}});
  assert.throws(() => runner.migrateHiaJsdocConfig({schemaVersion: oldVersion, inputs: [{path: "src"}], options: {extension}}), TypeError);
  assert.equal(invoked, false);
  const shared = {label: "共享 / shared"};
  const input = {schemaVersion: oldVersion, inputs: [{path: "src"}], options: {first: shared, second: shared}};
  const migrated = runner.migrateHiaJsdocConfig(input);
  assert.deepEqual(migrated.options.first, shared);
  assert.deepEqual(migrated.options.second, shared);
  migrated.options.first.label = "changed";
  assert.equal(shared.label, "共享 / shared");
});

test("published package schema resources match both exact in-memory schemas", () => {
  for (const version of [oldVersion, "1.0.0"]) {
    const file = path.join(root, "packages/jsdoc-runner/schemas", `hia-jsdoc-config-${version}.schema.json`);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), runner.getHiaJsdocConfigSchema(version));
  }
});

test("umbrella identity reader preserves both versions and rejects unknown identities", () => {
  for (const contractVersion of [oldVersion, "1.0.0"]) {
    const metadata = {...createHiaJsdocConfig().opts.hia.umbrella, contractVersion};
    assert.strictEqual(spec.readHiaJsdocUmbrellaConfig(metadata), metadata);
    assert.equal(metadata.contractVersion, contractVersion);
  }
  for (const metadata of [{contract: "hia-jsdoc-umbrella-config", contractVersion: "1.0.1"}, {contract: "SYNTHETIC_PRIVATE", contractVersion: "1.0.0"}, null]) {
    assert.throws(() => spec.readHiaJsdocUmbrellaConfig(metadata), (error) => error instanceof TypeError && !error.message.includes("SYNTHETIC_PRIVATE"));
  }
});
