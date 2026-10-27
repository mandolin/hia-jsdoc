/**
 * @lang zh-CN 检查 JSDoc 独立源码映射在父进程清单阶段的结构、隐私及同轮 integration 引用闭包。
 * @lang en Checks the standalone JSDoc source map's structure, privacy, and same-run integration reference closure at parent inventory time.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

import { validateJsdocDocSourceMap } from "../packages/jsdoc-runner/src/doc-source-map-validation.mjs";

/** @lang zh-CN 真实插件仍为 CommonJS；测试只读调用其纯 builder。 @lang en The real plugin remains CommonJS; this test only calls its pure builders. */
const require = createRequire(import.meta.url);
/** @lang zh-CN 真实 integration 择优与节点投影。 @lang en Real integration selection and node projection. */
const { buildIntegrationOutput } = require("../../jsdoc-plugin-hia-sys/src/runtime/output-contract.cjs");
/** @lang zh-CN 真实 1.1.0 地图构造器。 @lang en Real 1.1.0 map builder. */
const { buildJsdocDocSourceMap } = require("../../jsdoc-plugin-hia-sys/src/runtime/doc-source-map.cjs");

/**
 * @lang zh-CN 构造与当前插件 writer 形状一致的双节点工件，一条有精确来源、一条只有符号事实。
 * @lang en Builds a two-node artifact matching the current plugin writer, with one exact source and one symbol-only fact.
 * @returns {{map:object,integration:object}} 可独立修改的校验输入。 / Independent validation inputs.
 */
function fixture() {
  return {
    integration: {
      contract: "hia-jsdoc-integration",
      contractVersion: "0.1.0",
      pluginVersion: "0.1.0",
      artifactKind: "hia-integration",
      ir: { version: "0.1.0", source: "jsdoc", nodes: [{ id: "jsdoc:function:greet", kind: "function" }, { id: "jsdoc:class:Widget", kind: "class" }] }
    },
    map: {
      contract: "doc-source-map",
      contractVersion: "1.1.0",
      id: "jsdoc-doc-source-map",
      producer: { name: "@mandolin/jsdoc-plugin-hia-sys", version: "0.1.0", runtime: "jsdoc", profile: "jsdoc" },
      artifacts: [{ id: "artifact:jsdoc-integration", kind: "jsdoc-integration", path: "hia-integration.json", format: "json" }],
      sources: [{ id: "source:src%2Fgreet.js", kind: "javascript-source", path: "src/greet.js", language: "javascript", role: "original", sourcesContentPolicy: "none" }],
      sourceMaps: [],
      chains: [],
      entries: [
        {
          id: "entry:0", kind: "symbol", symbolId: "jsdoc:function:greet", symbolKind: "function",
          sourceRefs: [{ sourceId: "source:src%2Fgreet.js", range: { start: { line: 2, column: 1 }, end: { line: 2, column: 26 } }, rangeConvention: { endBoundary: "exclusive", columnUnit: "utf16-code-unit" }, rangeSource: "parser", rangeSourceDetail: "jsdoc-ast", confidence: "high" }],
          artifactRefs: [{ artifactId: "artifact:jsdoc-integration", selector: "ir.nodes.0", rangeSource: "adapter", confidence: "high" }], diagnostics: []
        },
        {
          id: "entry:1", kind: "symbol", symbolId: "jsdoc:class:Widget", symbolKind: "class", sourceRefs: [],
          artifactRefs: [{ artifactId: "artifact:jsdoc-integration", selector: "ir.nodes.1", rangeSource: "adapter", confidence: "high" }], diagnostics: []
        }
      ],
      privacy: { sourcesContentPolicy: "none", allowAbsolutePaths: false, allowUncPaths: false, allowPathTraversal: false },
      diagnostics: []
    }
  };
}

test("accepts the current closed JSDoc writer profile and exact integration pairing", () => {
  const { map, integration } = fixture();
  assert.equal(validateJsdocDocSourceMap(map, integration), true);
  // <lang><zh-CN>没有任何已证来源时，空 sources 与空 sourceRefs 仍是合法保守输出。</zh-CN><en>Without proven sources, empty sources and sourceRefs remain a valid conservative output.</en></lang>
  map.sources = [];
  map.entries[0].sourceRefs = [];
  assert.equal(validateJsdocDocSourceMap(map, integration), true);
});

test("accepts actual same-run plugin output with a verified AST range", () => {
  // <lang><zh-CN>真实文本放系统临时目录，并以同一 beforeParse 引用提供给插件构造器。</zh-CN><en>Place real text in a system temporary directory and give the plugin builder the same beforeParse event reference.</en></lang>
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hia-jsdoc-map-parent-validation-"));
  const sourceFile = path.join(temporaryRoot, "greet.js");
  const source = "/** Greets a visitor. */\nfunction greet(name) { return name; }\n";
  try {
    fs.writeFileSync(sourceFile, source, "utf8");
    const start = source.indexOf("function greet");
    const end = start + "function greet(name) { return name; }".length;
    const doclet = {
      kind: "function", name: "greet", longname: "greet", description: "Greets a visitor.",
      meta: { path: temporaryRoot, filename: "greet.js", range: [start, end], code: { node: { type: "FunctionDeclaration", range: [start, end] } } }
    };
    const integration = buildIntegrationOutput({
      config: { mode: "hiaIntegration", metadataKey: "hia" },
      output: { diagnostics: [], diagnosticCounts: { error: 0, warning: 0, info: 0 } },
      registries: { localizationResources: [] }
    }, [doclet]);
    const sourceEvent = { filename: sourceFile, source };
    const map = buildJsdocDocSourceMap({
      integration, doclets: [doclet], sourceRoot: temporaryRoot,
      sourceFiles: new Map([[sourceFile, { filePath: sourceFile, source, sourceEvent }]])
    });
    assert.equal(map.entries[0].sourceRefs.length, 1);
    assert.equal(validateJsdocDocSourceMap(map, integration), true);
  } finally {
    // <lang><zh-CN>递归清理前确认路径仍是系统临时根下带本测试前缀的真实直属目录。</zh-CN><en>Before recursive cleanup, confirm the real path is this test's prefixed direct child of the system temporary root.</en></lang>
    const realTemp = fs.realpathSync.native(os.tmpdir());
    const realTarget = fs.realpathSync.native(temporaryRoot);
    if (path.relative(realTemp, realTarget) !== path.basename(realTarget) ||
      !path.basename(realTarget).startsWith("hia-jsdoc-map-parent-validation-")) {
      throw new Error("Refusing recursive cleanup outside the JSDoc map validator test directory.");
    }
    fs.rmSync(realTarget, { recursive: true, force: true });
  }
});

test("requires the current 1.1.0 contract and fixed integration artifact identity", () => {
  const mutations = [
    (map) => { map.contractVersion = "1.0.0"; },
    (map) => { map.id = "private-map"; },
    (map) => { map.producer.name = "untrusted-plugin"; },
    (map) => { map.producer.version = "PRIVATE_MARKER"; },
    (map) => { map.artifacts[0].path = "../other.json"; },
    (map) => { map.artifacts[0].path = "other.json"; },
    (map) => { map.artifacts.push(structuredClone(map.artifacts[0])); }
  ];
  for (const mutate of mutations) {
    const { map, integration } = fixture();
    mutate(map);
    assert.equal(validateJsdocDocSourceMap(map, integration), false);
  }
  const { map, integration } = fixture();
  integration.contractVersion = "0.2.0";
  assert.equal(validateJsdocDocSourceMap(map, integration), false);
  integration.contractVersion = "0.1.0";
  integration.pluginVersion = "0.2.0";
  assert.equal(validateJsdocDocSourceMap(map, integration), false);
  integration.pluginVersion = "0.1.0";
  integration.ir.nodes.reverse();
  assert.equal(validateJsdocDocSourceMap(map, integration), false);
});

test("rejects unknown and content-bearing fields at every publication boundary", () => {
  const mutations = [
    (map) => { map.privateContent = "PRIVATE_MARKER"; },
    (map) => { map.producer.token = "PRIVATE_MARKER"; },
    (map) => { map.artifacts[0].content = "PRIVATE_MARKER"; },
    (map) => { map.sources[0].sourcesContent = "PRIVATE_MARKER"; },
    (map) => { map.entries[0].annotation = { text: "PRIVATE_MARKER" }; },
    (map) => { map.entries[0].sourceRefs[0].content = "PRIVATE_MARKER"; },
    (map) => { map.entries[0].artifactRefs[0].content = "PRIVATE_MARKER"; },
    (map) => { map.privacy.releaseGate = { details: "PRIVATE_MARKER" }; },
    (map) => { map.diagnostics = [{ message: "PRIVATE_MARKER" }]; },
    (map) => { map.chains = [{ id: "chain" }]; }
  ];
  for (const mutate of mutations) {
    const { map, integration } = fixture();
    mutate(map);
    assert.equal(validateJsdocDocSourceMap(map, integration), false);
  }
});

test("rejects escaped, absolute, UNC, ADS, and malformed source paths", () => {
  for (const unsafe of ["../secret.js", "/secret.js", "C:/secret.js", "\\\\server\\share\\secret.js", "src/file.js:secret", "src//file.js", "src/./file.js", "src/\uD800.js"]) {
    const { map, integration } = fixture();
    map.sources[0].path = unsafe;
    assert.equal(validateJsdocDocSourceMap(map, integration), false, unsafe);
  }
});

test("requires complete one-to-one entry, source, and artifact references", () => {
  const mutations = [
    ({ map }) => { map.entries.pop(); },
    ({ map }) => { map.entries[1].id = "entry:0"; },
    ({ map }) => { map.entries[0].symbolId = "jsdoc:function:other"; },
    ({ map }) => { map.entries[0].symbolKind = "class"; },
    ({ map }) => { map.entries[0].sourceRefs[0].sourceId = "source:missing"; },
    ({ map }) => { map.entries[0].artifactRefs[0].artifactId = "artifact:other"; },
    ({ map }) => { map.entries[0].artifactRefs[0].selector = "ir.nodes.1"; },
    ({ map }) => { map.entries[1].sourceRefs = structuredClone(map.entries[0].sourceRefs); map.sources.push({ ...map.sources[0], id: "source:orphan", path: "orphan.js" }); },
    ({ map }) => { map.sources.push(structuredClone(map.sources[0])); },
    ({ integration }) => { integration.ir.nodes[0].id = "jsdoc:function:other"; },
    ({ integration }) => { integration.ir.nodes[1].id = integration.ir.nodes[0].id; }
  ];
  for (const mutate of mutations) {
    const input = fixture();
    mutate(input);
    assert.equal(validateJsdocDocSourceMap(input.map, input.integration), false);
  }
});

test("rejects false precision, missing 1.1.0 range conventions, and unsafe privacy", () => {
  const mutations = [
    (map) => { delete map.entries[0].sourceRefs[0].rangeConvention; },
    (map) => { map.entries[0].sourceRefs[0].rangeConvention.columnUnit = "unknown"; },
    (map) => { map.entries[0].sourceRefs[0].rangeConvention.endBoundary = "inclusive"; },
    (map) => { map.entries[0].sourceRefs[0].range.end.column = 1; },
    (map) => { map.entries[0].sourceRefs[0].range.start.column = 0; },
    (map) => { map.entries[0].sourceRefs[0].range.end.line = 1; },
    (map) => { map.entries[0].sourceRefs.push(structuredClone(map.entries[0].sourceRefs[0])); },
    (map) => { map.privacy.sourcesContentPolicy = "embed"; },
    (map) => { map.privacy.allowAbsolutePaths = true; },
    (map) => { map.sources[0].sourcesContentPolicy = "embed"; }
  ];
  for (const mutate of mutations) {
    const { map, integration } = fixture();
    mutate(map);
    assert.equal(validateJsdocDocSourceMap(map, integration), false);
  }
});
