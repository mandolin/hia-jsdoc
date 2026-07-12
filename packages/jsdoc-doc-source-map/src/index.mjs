import { HIA_JSDOC_UMBRELLA_CONTRACT_VERSION } from "@hia-doc/jsdoc-spec";

/**
 * Creates a neutral doc-source-map reference object for JSDoc-derived artifacts.
 *
 * @param {object} [options] <lang><zh-CN>可选引用配置。</zh-CN><en>Optional reference configuration.</en></lang>
 * @param {string|null} [options.href] <lang><zh-CN>指向 documentation source map manifest 的链接。</zh-CN><en>Link to the documentation source map manifest.</en></lang>
 * @param {"none"|"reference"|"embed"} [options.sourcesContentPolicy="none"] <lang><zh-CN>源码内容策略，默认不内嵌源码。</zh-CN><en>Source content policy; source text is not embedded by default.</en></lang>
 * @returns {object} <lang><zh-CN>可放入 JSDoc artifact metadata 的 source map 引用。</zh-CN><en>A source map reference suitable for JSDoc artifact metadata.</en></lang>
 * @lang zh-CN 创建面向 JSDoc 产物的中性 documentation source map 引用对象。
 * @lang en Creates a neutral doc-source-map reference object for JSDoc-derived artifacts.
 */
export function createJsdocDocSourceMapRef(options = {}) {
  return {
    kind: "hia-doc-source-map-ref",
    profile: "jsdoc",
    profileVersion: HIA_JSDOC_UMBRELLA_CONTRACT_VERSION,
    href: options.href ?? null,
    sourcesContentPolicy: options.sourcesContentPolicy ?? "none"
  };
}
