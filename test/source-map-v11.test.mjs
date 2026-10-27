/**
 * @lang zh-CN 验证 JSDoc umbrella 对独立文档源码映射 1.1.0 的显式配置与产物闭包。
 * @lang en Verifies explicit JSDoc umbrella configuration and artifact closure for standalone documentation source maps 1.1.0.
 */
import assert from "node:assert/strict";
import fs, { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createHiaJsdocConfig } from "../packages/jsdoc-preset/src/index.mjs";
import { runHiaJsdocProject } from "../packages/jsdoc-runner/src/index.mjs";
import { stagedJsdocProducer } from "../packages/jsdoc-producer/src/staged.mjs";

test("JSDoc source map is opt-in in the generated plugin config", () => {
  // <lang><zh-CN>旧默认配置不新增可见开关；启用时只传固定 sidecar 的布尔意图。</zh-CN><en>The legacy default config gains no new visible switch; enabling passes only the fixed sidecar intent.</en></lang>
  const defaultConfig = createHiaJsdocConfig();
  const enabledConfig = createHiaJsdocConfig({ hia: { docSourceMap: { enabled: true } } });
  assert.equal(defaultConfig.opts.hia.docSourceMap, undefined);
  assert.deepEqual(enabledConfig.opts.hia.docSourceMap, { enabled: true });
  // <lang><zh-CN>baseConfig 维持现有后覆盖顺序，但有效开关也必须遵守固定文件的封闭字段规则。</zh-CN><en>baseConfig keeps its existing later-override order, but the effective switch must still obey the fixed-file closed-field rule.</en></lang>
  assert.equal(createHiaJsdocConfig({
    hia: { docSourceMap: { enabled: true } },
    baseConfig: { opts: { hia: { docSourceMap: { enabled: false } } } }
  }).opts.hia.docSourceMap.enabled, false);
  assert.throws(() => createHiaJsdocConfig({
    baseConfig: { opts: { hia: { docSourceMap: { enabled: true, outputFile: "other.json" } } } }
  }), /docSourceMap/);
  assert.throws(() => createHiaJsdocConfig({
    baseConfig: { opts: { hia: { docSourceMap: null } } }
  }), /docSourceMap/);
});

test("runner rejects an outside output before touching its existing sidecar", async () => {
  // <lang><zh-CN>外部目录位于本测试临时根内，失败调用不得删除其中的固定同名文件。</zh-CN><en>The outside directory remains inside this test's temporary root; the rejected call must not delete its fixed-name file.</en></lang>
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "hia-jsdoc-map-boundary-"));
  const workspaceRoot = path.join(temporaryRoot, "workspace");
  const outputDirectory = path.join(temporaryRoot, "outside");
  const sentinel = path.join(outputDirectory, "hia-doc-source-map.json");
  try {
    await mkdir(workspaceRoot);
    await mkdir(outputDirectory);
    await writeFile(sentinel, "SENTINEL", "utf8");
    assert.throws(() => runHiaJsdocProject({
      workspaceRoot,
      outputDirectory,
      inputs: [{ kind: "javascript-source", path: "src" }],
      options: { hia: { docSourceMap: { enabled: true } } }
    }), /inside workspaceRoot/);
    assert.equal(await readFile(sentinel, "utf8"), "SENTINEL");
    // <lang><zh-CN>词法上位于工作区的 Windows 联接仍指向外部兄弟目录，也必须在清理前拒绝。</zh-CN><en>A Windows junction lexically inside the workspace still points to the outside sibling and must be refused before cleanup.</en></lang>
    const junction = path.join(workspaceRoot, "junction-out");
    await symlink(outputDirectory, junction, "junction");
    assert.throws(() => runHiaJsdocProject({
      workspaceRoot,
      outputDirectory: junction,
      inputs: [{ kind: "javascript-source", path: "src" }],
      options: { hia: { docSourceMap: { enabled: true } } }
    }), /inside workspaceRoot/);
    assert.equal(await readFile(sentinel, "utf8"), "SENTINEL");
  } finally {
    // <lang><zh-CN>只清理本测试在系统临时目录建立的真实直属根。</zh-CN><en>Clean only this test's real direct root under the system temporary directory.</en></lang>
    const realTemp = await realpath(os.tmpdir());
    const realTarget = await realpath(temporaryRoot);
    const relativeTarget = path.relative(realTemp, realTarget);
    if (relativeTarget === path.basename(realTarget) && relativeTarget.startsWith("hia-jsdoc-map-boundary-")) {
      await rm(realTarget, { recursive: true, force: true });
    } else {
      throw new Error("Refusing recursive cleanup outside the JSDoc boundary test directory.");
    }
  }
});

test("runner rejects a progress callback that swaps its output for an outside junction", async () => {
  // <lang><zh-CN>回调可重入；模拟首次边界核对后把空目录换成外部联接，子进程开始前必须拒绝。</zh-CN><en>The callback is reentrant; swap the empty directory for an outside junction after the first boundary check and require rejection before the child starts.</en></lang>
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "hia-jsdoc-map-swap-"));
  const workspaceRoot = path.join(temporaryRoot, "workspace");
  const outputDirectory = path.join(workspaceRoot, "output");
  const originalDirectory = path.join(workspaceRoot, "original-output");
  const outsideRoot = path.join(temporaryRoot, "outside");
  const sentinel = path.join(outsideRoot, "hia-doc-source-map.json");
  try {
    await mkdir(workspaceRoot);
    await mkdir(outsideRoot);
    await writeFile(sentinel, "SENTINEL", "utf8");
    assert.throws(() => runHiaJsdocProject({
      workspaceRoot,
      outputDirectory,
      inputs: [{ kind: "javascript-source", path: "src" }],
      options: { hia: { docSourceMap: { enabled: true } } }
    }, {
      reportProgress(progress) {
        if (progress.phase !== "extract") return;
        fs.renameSync(outputDirectory, originalDirectory);
        fs.symlinkSync(outsideRoot, outputDirectory, "junction");
      }
    }), /outputDirectory changed/);
    assert.equal(await readFile(sentinel, "utf8"), "SENTINEL");
    assert.equal(existsSync(path.join(outsideRoot, "hia-integration.json")), false);
  } finally {
    // <lang><zh-CN>先去掉本测试联接，再核系统临时根的真实直属目录才进行递归清理。</zh-CN><en>Remove this test's junction first, then verify the real direct system-temp child before recursive cleanup.</en></lang>
    if (existsSync(outputDirectory) && fs.lstatSync(outputDirectory).isSymbolicLink()) {
      await rm(outputDirectory, { force: true });
    }
    const realTemp = await realpath(os.tmpdir());
    const realTarget = await realpath(temporaryRoot);
    if (path.relative(realTemp, realTarget) !== path.basename(realTarget)
      || !path.basename(realTarget).startsWith("hia-jsdoc-map-swap-")) {
      throw new Error("Refusing recursive cleanup outside the JSDoc swap test directory.");
    }
    await rm(realTarget, { recursive: true, force: true });
  }
});

test("staged producer rejects an external staging junction before recursive cleanup", async () => {
  // <lang><zh-CN>测试把联接目标放同一临时根；拒绝时外部旧文件必须原样保留。</zh-CN><en>The junction target is confined to this temporary root; rejection must preserve its existing outside file.</en></lang>
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "hia-jsdoc-stage-boundary-"));
  const workspaceRoot = path.join(temporaryRoot, "workspace");
  const outsideRoot = path.join(temporaryRoot, "outside");
  const stagingRoot = path.join(workspaceRoot, ".hia-jsdoc-staging");
  const outputDirectory = path.join(temporaryRoot, "publish");
  const sentinel = path.join(outsideRoot, "sentinel.txt");
  try {
    await mkdir(workspaceRoot);
    await mkdir(outsideRoot);
    await writeFile(sentinel, "SENTINEL", "utf8");
    await symlink(outsideRoot, stagingRoot, "junction");
    assert.throws(() => stagedJsdocProducer.produce({
      workspaceRoot,
      outputDirectory,
      inputs: [{ kind: "javascript-source", path: "src" }]
    }), /staging directory/);
    assert.equal(await readFile(sentinel, "utf8"), "SENTINEL");
    assert.equal(existsSync(outputDirectory), false);
  } finally {
    // <lang><zh-CN>先只删除本测试建立的联接，再核目标为系统临时根直属目录后递归清理。</zh-CN><en>Remove only the test junction first, then verify the root is a direct child of the system temp directory before recursive cleanup.</en></lang>
    await rm(stagingRoot, { force: true });
    const realTemp = await realpath(os.tmpdir());
    const realTarget = await realpath(temporaryRoot);
    if (path.relative(realTemp, realTarget) !== path.basename(realTarget)
      || !path.basename(realTarget).startsWith("hia-jsdoc-stage-boundary-")) {
      throw new Error("Refusing recursive cleanup outside the staging boundary test directory.");
    }
    await rm(realTarget, { recursive: true, force: true });
  }
});

test("enabled map refuses a baseConfig integration path outside this build", async () => {
  // <lang><zh-CN>后覆盖的 integration 输出若指向外部，JSDoc 子进程开始前必须拒绝，外部 sidecar 保持原值。</zh-CN><en>If a later integration override points outside, reject before starting the JSDoc child and preserve the outside sidecar.</en></lang>
  const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
  const outputDirectory = await mkdtemp(path.join(workspaceRoot, "fixtures", ".tmp-docmap-override-"));
  const outsideRoot = await mkdtemp(path.join(os.tmpdir(), "hia-jsdoc-map-outside-"));
  const outsideSidecar = path.join(outsideRoot, "hia-doc-source-map.json");
  try {
    await writeFile(outsideSidecar, "SENTINEL", "utf8");
    assert.throws(() => runHiaJsdocProject({
      workspaceRoot,
      outputDirectory,
      inputs: [{ kind: "javascript-source", path: "fixtures/basic/src" }],
      options: {
        includePattern: ".+\\.js$",
        plugin: { pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs" },
        theme: { template: "../jsdoc-theme-hia" },
        hia: { docSourceMap: { enabled: true } },
        baseConfig: { opts: { hia: { integration: { outputFile: path.join(outsideRoot, "hia-integration.json") } } } }
      }
    }), /integration output/);
    assert.equal(await readFile(outsideSidecar, "utf8"), "SENTINEL");
  } finally {
    // <lang><zh-CN>两个待删目标分别核定为 fixtures 和系统临时目录的真实直属前缀目录。</zh-CN><en>Independently verify both deletion targets as real prefixed direct children of fixtures and the system temp directory.</en></lang>
    const realFixtures = await realpath(path.join(workspaceRoot, "fixtures"));
    const realOutput = await realpath(outputDirectory);
    const realTemp = await realpath(os.tmpdir());
    const realOutside = await realpath(outsideRoot);
    if (path.relative(realFixtures, realOutput) !== path.basename(realOutput)
      || !path.basename(realOutput).startsWith(".tmp-docmap-override-")
      || path.relative(realTemp, realOutside) !== path.basename(realOutside)
      || !path.basename(realOutside).startsWith("hia-jsdoc-map-outside-")) {
      throw new Error("Refusing recursive cleanup outside the JSDoc override test directories.");
    }
    await rm(realOutput, { recursive: true, force: true });
    await rm(realOutside, { recursive: true, force: true });
  }
});

test("staged JSDoc copy excludes a map whose identity cannot be verified", async (t) => {
  // <lang><zh-CN>子进程真实写图，父进程仅模拟清单读取损坏，检验拒绝态不会把文件带进外部暂存输出。</zh-CN><en>The child writes a real map; only the parent inventory read is corrupted, checking that rejection cannot carry the file into external staged output.</en></lang>
  const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "hia-jsdoc-map-staged-"));
  const request = {
    workspaceRoot,
    outputDirectory,
    inputs: [{ kind: "javascript-source", path: "fixtures/basic/src" }],
    options: {
      includePattern: ".+\\.js$",
      plugin: { pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs" },
      theme: { template: "../jsdoc-theme-hia" },
      hia: { docSourceMap: { enabled: true } },
      writeResultManifest: false
    }
  };
  // <lang><zh-CN>先用同一外部目录完成一次有效地图，再重跑失效分支；旧文件不能混入第二次结果。</zh-CN><en>First create a valid map in the same external directory, then rerun the rejected branch; the old file must not leak into the second result.</en></lang>
  const baseline = stagedJsdocProducer.produce(request);
  assert.equal(baseline.status, "success", JSON.stringify(baseline.diagnostics));
  assert.equal(existsSync(path.join(outputDirectory, "hia-doc-source-map.json")), true);
  const originalRead = fs.readFileSync;
  t.mock.method(fs, "readFileSync", function (file, ...args) {
    if (typeof file === "string" && path.basename(file) === "hia-doc-source-map.json") {
      return "{PRIVATE_MARKER";
    }
    return originalRead.call(this, file, ...args);
  });
  try {
    const result = stagedJsdocProducer.produce(request);
    assert.equal(result.status, "partial");
    assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "HIA_JSDOC_DOC_SOURCE_MAP_INVALID"));
    assert.equal(result.artifacts.some((artifact) => artifact.kind === "doc-source-map"), false);
    assert.equal(existsSync(path.join(outputDirectory, "hia-doc-source-map.json")), false);
    assert.equal(JSON.stringify(result).includes("PRIVATE_MARKER"), false);
  } finally {
    // <lang><zh-CN>只递归清理系统临时目录中本测试前缀的真实直接子目录。</zh-CN><en>Recursively clean only this test's real direct prefixed child of the system temporary directory.</en></lang>
    const realTempRoot = await realpath(os.tmpdir());
    const realOutputDirectory = await realpath(outputDirectory);
    const relativeOutput = path.relative(realTempRoot, realOutputDirectory);
    if (relativeOutput === path.basename(realOutputDirectory) && relativeOutput.startsWith("hia-jsdoc-map-staged-")) {
      await rm(realOutputDirectory, { recursive: true, force: true });
    } else {
      throw new Error("Refusing recursive cleanup outside the JSDoc staged map test directory.");
    }
  }
});

test("staged JSDoc removes the prior external map when the next build disables it", async () => {
  // <lang><zh-CN>外部发布目录跨构建复用；第二轮目录复制不得保留第一轮已获承认的地图。</zh-CN><en>The external publish directory is reused; the second directory copy must not retain the first build's accepted map.</en></lang>
  const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "hia-jsdoc-map-switch-"));
  const request = {
    workspaceRoot,
    outputDirectory,
    inputs: [{ kind: "javascript-source", path: "fixtures/basic/src" }],
    options: {
      includePattern: ".+\\.js$",
      plugin: { pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs" },
      theme: { template: "../jsdoc-theme-hia" },
      hia: { docSourceMap: { enabled: true } },
      writeResultManifest: false
    }
  };
  try {
    assert.equal(stagedJsdocProducer.produce(request).status, "success");
    assert.equal(existsSync(path.join(outputDirectory, "hia-doc-source-map.json")), true);
    const disabled = stagedJsdocProducer.produce({ ...request, options: { ...request.options, hia: {} } });
    assert.equal(disabled.status, "success", JSON.stringify(disabled.diagnostics));
    assert.equal(disabled.artifacts.some(({ kind }) => kind === "doc-source-map"), false);
    assert.equal(existsSync(path.join(outputDirectory, "hia-doc-source-map.json")), false);
  } finally {
    // <lang><zh-CN>仅清理系统临时目录的真实直属测试子目录。</zh-CN><en>Clean only the real direct test child of the system temporary directory.</en></lang>
    const realTemp = await realpath(os.tmpdir());
    const realOutput = await realpath(outputDirectory);
    if (path.relative(realTemp, realOutput) !== path.basename(realOutput)
      || !path.basename(realOutput).startsWith("hia-jsdoc-map-switch-")) {
      throw new Error("Refusing recursive cleanup outside the staged switch test directory.");
    }
    await rm(realOutput, { recursive: true, force: true });
  }
});

test("JSDoc CLI failure after plugin processing does not retain the requested map", async () => {
  // <lang><zh-CN>模板故障发生在插件处理后；本轮失败时即使先写过 sidecar，也不能把它留给目录级发布。</zh-CN><en>The template failure occurs after plugin processing; even if the sidecar was written first, a failed run must not leave it for directory publishing.</en></lang>
  const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
  const outputDirectory = await mkdtemp(path.join(workspaceRoot, "fixtures", ".tmp-docmap-failed-cli-"));
  try {
    const result = runHiaJsdocProject({
      workspaceRoot,
      outputDirectory,
      inputs: [{ kind: "javascript-source", path: "fixtures/basic/src" }],
      options: {
        includePattern: ".+\\.js$",
        plugin: { pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs" },
        theme: { template: "../jsdoc-theme-hia/no-such-template" },
        hia: { docSourceMap: { enabled: true } },
        writeResultManifest: false
      }
    });
    assert.equal(result.status, "failed");
    assert.equal(result.artifacts.some(({ kind }) => kind === "doc-source-map"), false);
    assert.equal(existsSync(path.join(outputDirectory, "hia-doc-source-map.json")), false);
    assert.equal(JSON.stringify(result).includes(outputDirectory), false);
  } finally {
    // <lang><zh-CN>失败构建目录也只在已核实为 fixtures 的真实直属临时子目录后递归清理。</zh-CN><en>Recursively clean the failed build only after proving it is a real direct temporary child of fixtures.</en></lang>
    const realFixtures = await realpath(path.join(workspaceRoot, "fixtures"));
    const realOutput = await realpath(outputDirectory);
    if (path.relative(realFixtures, realOutput) !== path.basename(realOutput)
      || !path.basename(realOutput).startsWith(".tmp-docmap-failed-cli-")) {
      throw new Error("Refusing recursive cleanup outside the failed CLI test directory.");
    }
    await rm(realOutput, { recursive: true, force: true });
  }
});

test("JSDoc runner records an actually written 1.1.0 map beside integration", async () => {
  // <lang><zh-CN>复用仓内公开合成夹具，输出仅放在本仓 fixtures 下的本测试临时目录。</zh-CN><en>Use the repository's public synthetic fixture and confine output to this test's temporary fixtures child.</en></lang>
  const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
  const fixturesRoot = path.join(workspaceRoot, "fixtures");
  const outputDirectory = await mkdtemp(path.join(fixturesRoot, ".tmp-docmap-v11-"));
  try {
    const request = {
      workspaceRoot,
      outputDirectory,
      inputs: [{ kind: "javascript-source", path: "fixtures/basic/src" }],
      options: {
        includePattern: ".+\\.js$",
        plugin: { pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs" },
        theme: { template: "../jsdoc-theme-hia" },
        hia: { docSourceMap: { enabled: true } },
        writeResultManifest: false
      }
    };
    const result = runHiaJsdocProject(request);
    assert.equal(result.status, "success", JSON.stringify(result.diagnostics));
    const mapPath = path.join(outputDirectory, "hia-doc-source-map.json");
    const integrationPath = path.join(outputDirectory, "hia-integration.json");
    assert.equal(existsSync(mapPath), true);
    assert.equal(existsSync(integrationPath), true);
    const map = JSON.parse(await readFile(mapPath, "utf8"));
    const integration = JSON.parse(await readFile(integrationPath, "utf8"));
    const recorded = result.artifacts.find((artifact) => artifact.kind === "doc-source-map");
    assert.equal(map.contract, "doc-source-map");
    assert.equal(map.contractVersion, "1.1.0");
    assert.equal(recorded?.contract, map.contract);
    assert.equal(recorded?.contractVersion, map.contractVersion);
    assert.equal(recorded?.path, "hia-doc-source-map.json");
    assert.ok(map.entries.length > 0);
    assert.ok(map.entries.every((entry) => integration.ir.nodes.some((node) => node.id === entry.symbolId)));
    assert.equal(JSON.stringify(map).includes(workspaceRoot), false);
    // <lang><zh-CN>同一目录随后关闭开关，旧地图不能残留为新构建的可发布文件。</zh-CN><en>After disabling the switch in the same directory, the old map must not remain as a publishable file.</en></lang>
    const disabledResult = runHiaJsdocProject({
      ...request,
      options: { ...request.options, hia: {} }
    });
    assert.equal(disabledResult.status, "success", JSON.stringify(disabledResult.diagnostics));
    assert.equal(disabledResult.artifacts.some((artifact) => artifact.kind === "doc-source-map"), false);
    assert.equal(existsSync(mapPath), false);
  } finally {
    // <lang><zh-CN>递归删除前核真实路径是 fixtures 下本测试前缀的直接子目录。</zh-CN><en>Before recursive cleanup, verify the real target is this test's direct prefixed child of fixtures.</en></lang>
    const actualFixturesRoot = await realpath(fixturesRoot);
    const actualOutputDirectory = await realpath(outputDirectory);
    const relativeOutput = path.relative(actualFixturesRoot, actualOutputDirectory);
    if (relativeOutput === path.basename(actualOutputDirectory) && relativeOutput.startsWith(".tmp-docmap-v11-")) {
      await rm(actualOutputDirectory, { recursive: true, force: true });
    } else {
      throw new Error("Refusing recursive cleanup outside the JSDoc map test directory.");
    }
  }
});
