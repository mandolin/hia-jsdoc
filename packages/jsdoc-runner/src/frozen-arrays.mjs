/** @file @lang zh-CN 包内冻结数组纯数据定义，无导入和运行器副作用。 @lang en Owner-local frozen-array plain-data definitions without imports or runner side effects. */

/**
 * Lists the input kinds accepted by the HIA JSDoc project runner.
 *
 * @constant {string[]}
 * @lang zh-CN 列出 HIA JSDoc project runner 接受的输入类型。
 * @lang en Lists the input kinds accepted by the HIA JSDoc project runner.
 */
export const HIA_JSDOC_INPUT_KINDS = Object.freeze(["javascript-source", "javascript-module"]);

/**
 * Lists the artifact kinds that the HIA JSDoc project runner may produce.
 *
 * @constant {string[]}
 * @lang zh-CN 列出 HIA JSDoc project runner 可能产出的 artifact 类型。
 * @lang en Lists the artifact kinds that the HIA JSDoc project runner may produce.
 */
export const HIA_JSDOC_OUTPUT_KINDS = Object.freeze([
  "jsdoc-html",
  "jsdoc-search-index",
  "jsdoc-theme-metadata",
  "jsdoc-integration",
  "doc-source-map",
  "documentation-presentation-profile",
  "jsdoc-page-map"
]);
