export const HIA_JSDOC_UMBRELLA_CONTRACT = "hia-jsdoc-umbrella-config";
export const HIA_JSDOC_UMBRELLA_CONTRACT_VERSION = "0.1.0-draft";

export const HIA_JSDOC_PLUGIN_PACKAGE = "@mandolin/jsdoc-plugin-hia-sys";
export const HIA_JSDOC_PLUGIN_VERSION = "0.1.0";
export const HIA_JSDOC_PLUGIN_PATH = "node_modules/@mandolin/jsdoc-plugin-hia-sys/src/index.cjs";

export const HIA_JSDOC_THEME_PACKAGE = "@mandolin/jsdoc-theme-hia";
export const HIA_JSDOC_THEME_VERSION = "0.1.0";
export const HIA_JSDOC_THEME_TEMPLATE = "node_modules/@mandolin/jsdoc-theme-hia";

export const JSDOC_PACKAGE = "jsdoc";
export const JSDOC_VERSION = "4.0.5";

export const HIA_JSDOC_OUTPUT_MODES = Object.freeze(["standalone", "hiaIntegration", "both"]);
export const HIA_JSDOC_EXTRA_PLUGIN_PHASES = Object.freeze(["before", "after"]);

export function normalizeHiaJsdocMode(mode = "both") {
  if (!HIA_JSDOC_OUTPUT_MODES.includes(mode)) {
    throw new Error(`Unsupported HIA JSDoc output mode: ${mode}`);
  }
  return mode;
}

export function createHiaJsdocVersionSummary() {
  return {
    contract: HIA_JSDOC_UMBRELLA_CONTRACT,
    contractVersion: HIA_JSDOC_UMBRELLA_CONTRACT_VERSION,
    jsdoc: {
      package: JSDOC_PACKAGE,
      version: JSDOC_VERSION
    },
    plugin: {
      package: HIA_JSDOC_PLUGIN_PACKAGE,
      version: HIA_JSDOC_PLUGIN_VERSION
    },
    theme: {
      package: HIA_JSDOC_THEME_PACKAGE,
      version: HIA_JSDOC_THEME_VERSION
    }
  };
}
