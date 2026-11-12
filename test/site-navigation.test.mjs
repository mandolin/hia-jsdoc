/**
 * @file
 * @lang zh-CN preset显式透传站点输入，同时保留未选择时的原结构。
 * @lang en Explicit site-input forwarding through the preset while retaining the unselected structure.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHiaJsdocConfig } from "../packages/jsdoc-preset/src/index.mjs";

test("preset forwards explicit site navigation and UI locale without manufacturing defaults", () => {
  const siteNavigation = { contract: "documentation-site-navigation", contractVersion: "0.1.0-draft" };
  const selected = createHiaJsdocConfig({ hia: { siteNavigation, uiLocale: "zh-CN" } });
  assert.deepEqual(selected.opts.hia.siteNavigation, siteNavigation);
  assert.equal(selected.opts.hia.uiLocale, "zh-CN");
  const original = createHiaJsdocConfig();
  assert.equal(Object.hasOwn(original.opts.hia, "siteNavigation"), false);
  assert.equal(Object.hasOwn(original.opts.hia, "uiLocale"), false);
});
