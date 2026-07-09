import {
  HIA_JSDOC_PLUGIN_PACKAGE,
  HIA_JSDOC_PLUGIN_PATH,
  HIA_JSDOC_PLUGIN_VERSION
} from "@hia-doc/jsdoc-spec";

export function createHiaJsdocPluginBridge(options = {}) {
  return {
    package: options.packageName ?? HIA_JSDOC_PLUGIN_PACKAGE,
    version: options.version ?? HIA_JSDOC_PLUGIN_VERSION,
    pluginPath: options.pluginPath ?? HIA_JSDOC_PLUGIN_PATH,
    order: options.order ?? "hia-core"
  };
}

export function getHiaJsdocPluginPath(options = {}) {
  return createHiaJsdocPluginBridge(options).pluginPath;
}
