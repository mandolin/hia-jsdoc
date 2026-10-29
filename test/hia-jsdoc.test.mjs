import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import fs from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { normalizeExtraPluginRegistry } from "../packages/jsdoc-extra-plugin-registry/src/index.mjs";
import { createHiaJsdocConfig } from "../packages/jsdoc-preset/src/index.mjs";
import {
  createHiaJsdocPortalUiLocaleBridge,
  createHiaJsdocVersionSummary
} from "../packages/jsdoc-spec/src/index.mjs";
import { createHiaJsdocThemeBridge } from "../packages/jsdoc-theme-bridge/src/index.mjs";
import {
  HIA_JSDOC_CONFIG_SCHEMA_ID,
  HIA_JSDOC_CONFIG_SCHEMA_VERSION,
  loadHiaJsdocConfig,
  runHiaJsdocProject
} from "../packages/jsdoc-runner/src/index.mjs";
import { jsdocProducer } from "../packages/jsdoc-producer/src/index.mjs";
import { stagedJsdocProducer } from "../packages/jsdoc-producer/src/staged.mjs";

test("createHiaJsdocConfig creates a standard JSDoc config", () => {
  const config = createHiaJsdocConfig({
    source: { include: ["fixtures/basic/src"] },
    destination: "fixtures/basic/out",
    integrationOutputFile: "fixtures/basic/out/hia-integration.json"
  });

  assert.ok(config.plugins.includes("node_modules/@mandolin/jsdoc-plugin-hia-sys/src/index.cjs"));
  assert.equal(config.opts.template, "node_modules/@mandolin/jsdoc-theme-hia");
  assert.equal(config.opts.hia.integration.enabled, true);
  assert.equal(config.opts.hia.umbrella.contract, "hia-jsdoc-umbrella-config");
  assert.equal(config.opts.hia.presentation.pageMode, "multi-page");
  assert.equal(config.opts.hia.presentation.sourceMode, "fetch");
  assert.equal(config.opts.hia.theme.scheme, "system");
  assert.equal(config.opts.hia.umbrella.themeBridge.presentation.skinCatalog.ownerPackage, "@mandolin/jsdoc-theme-hia");
  assert.equal(config.opts.hia.umbrella.portalUiLocaleBridge.profileId, "hia-jsdoc.portal-bridge");
});

test("Portal bridge declares W-P123 owner adoption without copying owner-private content", () => {
  // <lang><zh-CN>descriptor 是跨仓公开边界，因此同时核对 exact identity 与隐私负面保证。</zh-CN><en>The descriptor is a public cross-repository boundary, so the test verifies both exact identity and negative privacy guarantees.</en></lang>
  const descriptor = createHiaJsdocPortalUiLocaleBridge();
  const serialized = JSON.stringify(descriptor);

  assert.deepEqual(descriptor, {
    capability: "documentation-ui-locale-completeness",
    capabilityVersion: "1.0.0",
    ownerPackage: "@hia-doc/renderer-html",
    profileId: "hia-jsdoc.portal-bridge",
    surfaceId: "hia-jsdoc.portal-bridge",
    reportPath: "documentation-ui-locale-completeness.json",
    uiLocales: ["zh-CN", "en"],
    modes: ["interactive", "no-script"],
    channels: ["visible", "accessibility", "status"],
    privacy: "metadata-only"
  });
  assert.equal(serialized.includes("Search"), false);
  assert.equal(serialized.includes("搜索"), false);
  assert.equal(serialized.includes("selector"), false);
  assert.equal(serialized.includes("css"), false);
  assert.equal(serialized.includes("target"), false);
});

test("theme bridge delegates the skin catalog to JTH without copying skin implementation", () => {
  const bridge = createHiaJsdocThemeBridge({
    skin: "graphite",
    scheme: "dark",
    presentation: {
      pageMode: "single-page",
      sourceMode: "embed"
    }
  });

  assert.equal(bridge.presentation.contract, "documentation-presentation-profile");
  assert.equal(bridge.presentation.contractVersion, "1.0.0");
  assert.equal(bridge.presentation.pageMode, "single-page");
  assert.equal(bridge.presentation.sourceMode, "embed");
  assert.equal(bridge.presentation.skinId, "graphite");
  assert.deepEqual(bridge.presentation.skinCatalog, {
    ownerPackage: "@mandolin/jsdoc-theme-hia",
    projection: "documentation-presentation-profile.theme.skins"
  });
  assert.equal(JSON.stringify(bridge).includes("css"), false);
  assert.equal(JSON.stringify(bridge).includes("selector"), false);
});

test("normalizeExtraPluginRegistry keeps plugin order and diagnostics", () => {
  const registry = normalizeExtraPluginRegistry({
    before: ["node_modules/example-before"],
    after: [{ module: "node_modules/example-after", optional: true }, { module: "../unsafe" }]
  });

  assert.deepEqual(registry.before.map((plugin) => plugin.module), ["node_modules/example-before"]);
  assert.deepEqual(registry.after.map((plugin) => plugin.module), ["node_modules/example-after"]);
  assert.ok(registry.diagnostics.some((diagnostic) => diagnostic.code === "HIA_JSDOC_PLUGIN_PATH_UNSAFE"));
});

test("version summary records exact candidate plugin and theme dependencies", () => {
  const summary = createHiaJsdocVersionSummary();
  assert.equal(summary.plugin.package, "@mandolin/jsdoc-plugin-hia-sys");
  assert.equal(summary.plugin.version, "1.0.0");
  assert.equal(summary.theme.package, "@mandolin/jsdoc-theme-hia");
  assert.equal(summary.theme.version, "1.0.0");
});

test("fixture build emits HIA integration output", async () => {
  const integration = JSON.parse(await readFile(new URL("../fixtures/basic/out/hia-integration.json", import.meta.url), "utf8"));
  assert.equal(integration.contract, "hia-jsdoc-integration");
  assert.equal(integration.artifactKind, "hia-integration");
});

test("self-doc fixture keeps inline lang syntax canonical", async () => {
  const integration = JSON.parse(await readFile(new URL("../fixtures/self-doc/out/hia-integration.json", import.meta.url), "utf8"));
  const malformedDiagnostics = (integration.ir?.nodes ?? [])
    .flatMap((node) => Array.isArray(node.diagnostics) ? node.diagnostics : [])
    .filter((diagnostic) => diagnostic?.code === "HIA_I18N_INLINE_LANG_MALFORMED");

  assert.equal(malformedDiagnostics.length, 0);
});

test("runHiaJsdocProject emits a producer result for self-doc", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const outputDirectory = path.join(root, "fixtures", "self-doc", `.tmp-${process.pid}`);
  await mkdir(outputDirectory, { recursive: true });
  try {
    const result = runHiaJsdocProject({
      workspaceRoot: root,
      outputDirectory,
      inputs: [{ kind: "javascript-module", path: "packages/jsdoc-spec/src" }],
      options: {
        includePattern: ".+\\.mjs$",
        plugin: {
          pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs"
        },
        theme: {
          template: "../jsdoc-theme-hia"
        },
        hia: {
          i18n: {
            enabled: true,
            locales: ["en", "zh-CN"]
          }
        }
      }
    });

    assert.equal(result.contract, "documentation-producer-result");
    assert.equal(result.status, "success");
    assert.ok(result.artifacts.some((artifact) => artifact.kind === "jsdoc-integration"));
    assert.ok(result.artifacts.some((artifact) => artifact.kind === "documentation-presentation-profile"));
    assert.ok(result.artifacts.some((artifact) => artifact.kind === "jsdoc-page-map"));
    assert.equal(existsSync(path.join(outputDirectory, "documentation-presentation-profile.json")), true);
    const presentation = JSON.parse(await readFile(path.join(outputDirectory, "documentation-presentation-profile.json"), "utf8"));
    assert.equal(presentation.contractVersion, "1.0.0");
    assert.equal(result.artifacts.find((artifact) => artifact.kind === "documentation-presentation-profile").contractVersion, presentation.contractVersion);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

// <lang><zh-CN>只替换父进程对固定产物的读取，真实JSDoc仍生成自己的文件；每个测试结束自动恢复mock。</zh-CN><en>Replace only the parent process's fixed artifact read; real JSDoc still generates its own files, and each test automatically restores the mock.</en></lang>
for (const kind of ["old-version", "unknown-version", "wrong-contract", "malformed-json", "read-failure"]) {
  test(`presentation inventory refuses ${kind} without echoing input`, async (t) => {
    // <lang><zh-CN>输出仅位于本测试fixtures直接子目录，不读取或更改业务项目。</zh-CN><en>Output is confined to this test's direct fixtures child, without reading or changing business projects.</en></lang>
    const root = fileURLToPath(new URL("..", import.meta.url));
    const output = await mkdtemp(path.join(root, "fixtures", ".tmp-presentation-"));
    const original = fs.readFileSync;
    t.mock.method(fs, "readFileSync", function (file, ...args) {
      if (typeof file === "string" && path.basename(file) === "documentation-presentation-profile.json") {
        if (kind === "read-failure") throw new Error("SYNTHETIC_PRIVATE_MARKER");
        if (kind === "malformed-json") return "{SYNTHETIC_PRIVATE_MARKER";
        return JSON.stringify({ contract: kind === "wrong-contract" ? "SYNTHETIC_PRIVATE_MARKER" : "documentation-presentation-profile", contractVersion: kind === "old-version" ? "0.1.0-draft" : "9.0.0" });
      }
      return original.call(this, file, ...args);
    });
    try {
      const result = runHiaJsdocProject({ workspaceRoot: root, outputDirectory: output, inputs: [{ kind: "javascript-module", path: "packages/jsdoc-spec/src" }], options: { includePattern: ".+\\.mjs$", plugin: { pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs" }, theme: { template: "../jsdoc-theme-hia" } } });
      assert.equal(result.status, "partial");
      assert.ok(result.diagnostics.some(({ code }) => code === "HIA_JSDOC_PRESENTATION_ARTIFACT_INVALID"));
      assert.equal(result.artifacts.some(({ kind }) => kind === "documentation-presentation-profile"), false);
      assert.equal(JSON.stringify(result).includes("SYNTHETIC_PRIVATE_MARKER"), false);
    } finally {
      // <lang><zh-CN>删除前核对解析后的父目录，清理仅限本次mkdtemp返回目录。</zh-CN><en>Verify the resolved parent before deletion; cleanup is limited to this invocation's mkdtemp directory.</en></lang>
      assert.equal(path.dirname(path.resolve(output)), path.resolve(root, "fixtures"));
      await rm(output, { recursive: true, force: true });
    }
  });
}

test("loadHiaJsdocConfig normalizes versioned config", () => {
  const request = loadHiaJsdocConfig("examples/standalone/hia-jsdoc.config.json", {
    cwd: fileURLToPath(new URL("..", import.meta.url))
  });

  assert.equal(request.inputs[0].path, "src");
  assert.equal(request.options.mode, "both");
  assert.equal(request.options.writeResultManifest, true);
  assert.equal(request.options.hia.presentation.pageMode, "multi-page");
  assert.equal(request.options.hia.presentation.sourceMode, "fetch");
  assert.equal(HIA_JSDOC_CONFIG_SCHEMA_ID.includes("hia-jsdoc-config"), true);
  assert.equal(HIA_JSDOC_CONFIG_SCHEMA_VERSION, "1.0.0");
});

test("project runner rejects unknown presentation selections", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  assert.throws(() => runHiaJsdocProject({
    workspaceRoot: root,
    outputDirectory: path.join(root, "fixtures", "invalid-presentation"),
    inputs: [{ kind: "javascript-module", path: "packages/jsdoc-spec/src" }],
    options: {
      hia: {
        presentation: {
          pageMode: "book",
          sourceMode: "fetch"
        }
      }
    }
  }), /Unsupported presentation pageMode/);
});

test("jsdoc producer delegates to project runner", () => {
  assert.equal(jsdocProducer.descriptor.contract, "documentation-producer");
  assert.ok(jsdocProducer.descriptor.outputKinds.includes("jsdoc-integration"));
});

test("staged jsdoc producer copies artifacts to an external orchestration output", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "hia-jsdoc-staged-"));

  try {
    const result = stagedJsdocProducer.produce({
      workspaceRoot: root,
      outputDirectory,
      inputs: [{ kind: "javascript-module", path: "packages/jsdoc-spec/src" }],
      options: {
        includePattern: ".+\\.mjs$",
        plugin: {
          pluginPath: "../jsdoc-plugin-hia-sys/src/index.cjs"
        },
        theme: {
          template: "../jsdoc-theme-hia"
        },
        hia: {
          i18n: {
            enabled: true,
            locales: ["en", "zh-CN"]
          }
        }
      }
    });

    assert.equal(result.status, "success");
    assert.ok(result.artifacts.some((artifact) => artifact.kind === "jsdoc-integration"));
    assert.ok(result.artifacts.some((artifact) => artifact.kind === "documentation-presentation-profile"));
    assert.ok(existsSync(path.join(outputDirectory, "hia-integration.json")));
    assert.ok(existsSync(path.join(outputDirectory, "documentation-presentation-profile.json")));
    assert.equal(existsSync(path.join(root, ".hia-jsdoc-staging")), false);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
