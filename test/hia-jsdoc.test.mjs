import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { normalizeExtraPluginRegistry } from "../packages/jsdoc-extra-plugin-registry/src/index.mjs";
import { createHiaJsdocConfig } from "../packages/jsdoc-preset/src/index.mjs";
import { createHiaJsdocVersionSummary } from "../packages/jsdoc-spec/src/index.mjs";
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
  assert.equal(bridge.presentation.contractVersion, "0.1.0-draft");
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

test("version summary records published JPHS and JTH dependencies", () => {
  const summary = createHiaJsdocVersionSummary();
  assert.equal(summary.plugin.package, "@mandolin/jsdoc-plugin-hia-sys");
  assert.equal(summary.plugin.version, "0.1.0");
  assert.equal(summary.theme.package, "@mandolin/jsdoc-theme-hia");
  assert.equal(summary.theme.version, "0.1.0");
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
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

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
  assert.equal(HIA_JSDOC_CONFIG_SCHEMA_VERSION, "0.1.0-draft");
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
