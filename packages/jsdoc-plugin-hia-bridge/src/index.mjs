import {
  HIA_JSDOC_PLUGIN_PACKAGE,
  HIA_JSDOC_PLUGIN_PATH,
  HIA_JSDOC_PLUGIN_VERSION
} from "@hia-doc/jsdoc-spec";

/**
 * Creates the bridge descriptor for the HIA JSDoc plugin package.
 *
 * @param {object} [options] <lang zh-CN>插件包名、版本、路径或顺序覆盖项。</lang><lang en>Plugin package, version, path, or ordering overrides.</lang>
 * @returns {object} <lang zh-CN>用于 preset/runner 组装 JSDoc 插件链的 bridge descriptor。</lang><lang en>A bridge descriptor used by the preset and runner to assemble the JSDoc plugin chain.</lang>
 * @lang zh-CN 创建 HIA JSDoc 插件包的 bridge descriptor。
 * @lang en Creates the bridge descriptor for the HIA JSDoc plugin package.
 */
export function createHiaJsdocPluginBridge(options = {}) {
  return {
    package: options.packageName ?? HIA_JSDOC_PLUGIN_PACKAGE,
    version: options.version ?? HIA_JSDOC_PLUGIN_VERSION,
    pluginPath: options.pluginPath ?? HIA_JSDOC_PLUGIN_PATH,
    order: options.order ?? "hia-core"
  };
}

/**
 * Resolves the JSDoc plugin path from the HIA plugin bridge descriptor.
 *
 * @param {object} [options] <lang zh-CN>传递给插件 bridge descriptor 的覆盖项。</lang><lang en>Overrides passed to the plugin bridge descriptor.</lang>
 * @returns {string} <lang zh-CN>JSDoc 可加载的插件路径。</lang><lang en>The plugin path loadable by JSDoc.</lang>
 * @lang zh-CN 从 HIA 插件 bridge descriptor 中解析 JSDoc 插件路径。
 * @lang en Resolves the JSDoc plugin path from the HIA plugin bridge descriptor.
 */
export function getHiaJsdocPluginPath(options = {}) {
  return createHiaJsdocPluginBridge(options).pluginPath;
}
