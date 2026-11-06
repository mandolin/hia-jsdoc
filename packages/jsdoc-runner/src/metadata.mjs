/** @file @lang zh-CN 运行器纯元数据，含版本及冻结输入/输出种类。 @lang en Pure runner metadata containing its version and frozen input/output kinds. */

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

/**
 * Declares the runtime version of the HIA JSDoc runner package.
 *
 * @constant {string}
 * @lang zh-CN 声明 HIA JSDoc runner 包的运行时版本。
 * @lang en Declares the runtime version of the HIA JSDoc runner package.
 */
export const HIA_JSDOC_RUNNER_VERSION = "1.0.0";
