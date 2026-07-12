import {
  HIA_JSDOC_THEME_PACKAGE,
  HIA_JSDOC_THEME_TEMPLATE,
  HIA_JSDOC_THEME_VERSION
} from "@hia-doc/jsdoc-spec";

/**
 * Creates the bridge descriptor for the HIA JSDoc theme package.
 *
 * @param {object} [options] <lang zh-CN>主题包名、版本、模板路径或启用状态覆盖项。</lang><lang en>Theme package, version, template path, or enabled-state overrides.</lang>
 * @returns {object} <lang zh-CN>用于 preset/runner 选择 JSDoc theme template 的 bridge descriptor。</lang><lang en>A bridge descriptor used by the preset and runner to select the JSDoc theme template.</lang>
 * @lang zh-CN 创建 HIA JSDoc 主题包的 bridge descriptor。
 * @lang en Creates the bridge descriptor for the HIA JSDoc theme package.
 */
export function createHiaJsdocThemeBridge(options = {}) {
  return {
    package: options.packageName ?? HIA_JSDOC_THEME_PACKAGE,
    version: options.version ?? HIA_JSDOC_THEME_VERSION,
    template: options.template ?? HIA_JSDOC_THEME_TEMPLATE,
    enabled: options.enabled ?? true
  };
}

/**
 * Resolves the JSDoc theme template path from the HIA theme bridge descriptor.
 *
 * @param {object} [options] <lang zh-CN>传递给主题 bridge descriptor 的覆盖项。</lang><lang en>Overrides passed to the theme bridge descriptor.</lang>
 * @returns {string} <lang zh-CN>JSDoc 可使用的 theme template 路径。</lang><lang en>The theme template path usable by JSDoc.</lang>
 * @lang zh-CN 从 HIA 主题 bridge descriptor 中解析 JSDoc theme template 路径。
 * @lang en Resolves the JSDoc theme template path from the HIA theme bridge descriptor.
 */
export function getHiaJsdocThemeTemplate(options = {}) {
  return createHiaJsdocThemeBridge(options).template;
}
