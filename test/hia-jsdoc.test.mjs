import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { normalizeExtraPluginRegistry } from "../packages/jsdoc-extra-plugin-registry/src/index.mjs";
import { createHiaJsdocConfig } from "../packages/jsdoc-preset/src/index.mjs";
import { createHiaJsdocVersionSummary } from "../packages/jsdoc-spec/src/index.mjs";

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
