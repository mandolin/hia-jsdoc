/**
 * Identifies the umbrella configuration contract emitted by the HIA JSDoc preset.
 *
 * @constant {string}
 * @lang zh-CN 标识 HIA JSDoc preset 输出的 umbrella 配置合同。
 * @lang en Identifies the umbrella configuration contract emitted by the HIA JSDoc preset.
 */
export const HIA_JSDOC_UMBRELLA_CONTRACT = "hia-jsdoc-umbrella-config";

/**
 * Declares the draft version of the HIA JSDoc umbrella configuration contract.
 *
 * @constant {string}
 * @lang zh-CN 声明 HIA JSDoc umbrella 配置合同的草案版本。
 * @lang en Declares the draft version of the HIA JSDoc umbrella configuration contract.
 */
export const HIA_JSDOC_UMBRELLA_CONTRACT_VERSION = "0.1.0-draft";

/**
 * Names the published HIA JSDoc plugin package consumed by the umbrella preset.
 *
 * @constant {string}
 * @lang zh-CN 记录 umbrella preset 消费的已发布 HIA JSDoc 插件包名。
 * @lang en Names the published HIA JSDoc plugin package consumed by the umbrella preset.
 */
export const HIA_JSDOC_PLUGIN_PACKAGE = "@mandolin/jsdoc-plugin-hia-sys";

/**
 * Pins the published HIA JSDoc plugin version used by this compatibility layer.
 *
 * @constant {string}
 * @lang zh-CN 固定当前兼容层使用的已发布 HIA JSDoc 插件版本。
 * @lang en Pins the published HIA JSDoc plugin version used by this compatibility layer.
 */
export const HIA_JSDOC_PLUGIN_VERSION = "0.1.0";

/**
 * Points JSDoc config generation at the local plugin entry resolved from dependencies.
 *
 * @constant {string}
 * @lang zh-CN 指向从依赖中解析出的本地插件入口，用于生成 JSDoc 配置。
 * @lang en Points JSDoc config generation at the local plugin entry resolved from dependencies.
 */
export const HIA_JSDOC_PLUGIN_PATH = "node_modules/@mandolin/jsdoc-plugin-hia-sys/src/index.cjs";

/**
 * Names the published HIA JSDoc theme package consumed by the umbrella preset.
 *
 * @constant {string}
 * @lang zh-CN 记录 umbrella preset 消费的已发布 HIA JSDoc 主题包名。
 * @lang en Names the published HIA JSDoc theme package consumed by the umbrella preset.
 */
export const HIA_JSDOC_THEME_PACKAGE = "@mandolin/jsdoc-theme-hia";

/**
 * Pins the published HIA JSDoc theme version used by this compatibility layer.
 *
 * @constant {string}
 * @lang zh-CN 固定当前兼容层使用的已发布 HIA JSDoc 主题版本。
 * @lang en Pins the published HIA JSDoc theme version used by this compatibility layer.
 */
export const HIA_JSDOC_THEME_VERSION = "0.1.0";

/**
 * Points JSDoc config generation at the theme template resolved from dependencies.
 *
 * @constant {string}
 * @lang zh-CN 指向从依赖中解析出的主题模板路径，用于生成 JSDoc 配置。
 * @lang en Points JSDoc config generation at the theme template resolved from dependencies.
 */
export const HIA_JSDOC_THEME_TEMPLATE = "node_modules/@mandolin/jsdoc-theme-hia";

/**
 * Names the upstream JSDoc package used by the HIA JSDoc runner.
 *
 * @constant {string}
 * @lang zh-CN 记录 HIA JSDoc runner 使用的上游 JSDoc 包名。
 * @lang en Names the upstream JSDoc package used by the HIA JSDoc runner.
 */
export const JSDOC_PACKAGE = "jsdoc";

/**
 * Pins the upstream JSDoc version used by the HIA JSDoc runner.
 *
 * @constant {string}
 * @lang zh-CN 固定 HIA JSDoc runner 使用的上游 JSDoc 版本。
 * @lang en Pins the upstream JSDoc version used by the HIA JSDoc runner.
 */
export const JSDOC_VERSION = "4.0.5";

/**
 * Lists supported HIA JSDoc output modes for config normalization.
 *
 * @constant {ReadonlyArray<string>}
 * @lang zh-CN 列出配置规范化可接受的 HIA JSDoc 输出模式。
 * @lang en Lists supported HIA JSDoc output modes for config normalization.
 */
export const HIA_JSDOC_OUTPUT_MODES = Object.freeze(["standalone", "hiaIntegration", "both"]);

/**
 * Lists plugin insertion phases supported by the extra plugin registry.
 *
 * @constant {ReadonlyArray<string>}
 * @lang zh-CN 列出额外插件注册表支持的插件插入阶段。
 * @lang en Lists plugin insertion phases supported by the extra plugin registry.
 */
export const HIA_JSDOC_EXTRA_PLUGIN_PHASES = Object.freeze(["before", "after"]);

/**
 * Normalizes an HIA JSDoc output mode and rejects unknown modes.
 *
 * @param {string} [mode="both"] <lang><en>Candidate output mode.</en><zh-CN>候选输出模式。</zh-CN></lang>
 * @returns {string} <lang><en>Supported output mode.</en><zh-CN>受支持的输出模式。</zh-CN></lang>
 * @throws {Error} <lang><en>When the mode is not part of the HIA JSDoc mode registry.</en><zh-CN>当模式不在 HIA JSDoc 模式注册表内时抛出。</zh-CN></lang>
 * @lang zh-CN 规范化 HIA JSDoc 输出模式，并拒绝未登记的模式。
 * @lang en Normalizes an HIA JSDoc output mode and rejects unknown modes.
 */
export function normalizeHiaJsdocMode(mode = "both") {
  if (!HIA_JSDOC_OUTPUT_MODES.includes(mode)) {
    throw new Error(`Unsupported HIA JSDoc output mode: ${mode}`);
  }
  return mode;
}

/**
 * Creates the dependency version summary embedded into generated HIA JSDoc configs.
 *
 * @returns {object} <lang><en>Version summary for JSDoc, JPHS and JTH dependencies.</en><zh-CN>JSDoc、JPHS 与 JTH 依赖的版本摘要。</zh-CN></lang>
 * @lang zh-CN 创建写入 HIA JSDoc 生成配置的依赖版本摘要。
 * @lang en Creates the dependency version summary embedded into generated HIA JSDoc configs.
 */
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
