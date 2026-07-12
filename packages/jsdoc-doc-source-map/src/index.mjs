import { HIA_JSDOC_UMBRELLA_CONTRACT_VERSION } from "@hia-doc/jsdoc-spec";

/**
 * Creates a neutral doc-source-map reference object for JSDoc-derived artifacts.
 *
 * @param {object} [options] <lang zh-CN>可选引用配置。</lang><lang en>Optional reference configuration.</lang>
 * @param {string|null} [options.href] <lang zh-CN>指向 documentation source map manifest 的链接。</lang><lang en>Link to the documentation source map manifest.</lang>
 * @param {"none"|"reference"|"embed"} [options.sourcesContentPolicy="none"] <lang zh-CN>源码内容策略，默认不内嵌源码。</lang><lang en>Source content policy; source text is not embedded by default.</lang>
 * @returns {object} <lang zh-CN>可放入 JSDoc artifact metadata 的 source map 引用。</lang><lang en>A source map reference suitable for JSDoc artifact metadata.</lang>
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
