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
 * Identifies the renderer-neutral presentation profile adopted by the HIA JSDoc owner chain.
 *
 * @constant {string}
 * @lang zh-CN 标识 HIA JSDoc owner chain 采用的 renderer-neutral presentation profile。
 * @lang en Identifies the renderer-neutral presentation profile adopted by the HIA JSDoc owner chain.
 */
export const HIA_JSDOC_PRESENTATION_PROFILE_CONTRACT = "documentation-presentation-profile";

/**
 * Pins the exact draft presentation profile version consumed by the HIA JSDoc bridge.
 *
 * @constant {string}
 * @lang zh-CN 固定 HIA JSDoc bridge 消费的 exact draft presentation profile 版本。
 * @lang en Pins the exact draft presentation profile version consumed by the HIA JSDoc bridge.
 */
export const HIA_JSDOC_PRESENTATION_PROFILE_CONTRACT_VERSION = "0.1.0-draft";

/**
 * Identifies the neutral UI-locale completeness capability consumed by the Portal bridge.
 *
 * @constant {string}
 * @lang zh-CN 标识 hia-jsdoc Portal bridge 消费的中性 UI-locale 完整性能力；它不是新的 report contract。
 * @lang en Identifies the neutral UI-locale completeness capability consumed by the hia-jsdoc Portal bridge; it is not a new report contract.
 */
export const HIA_JSDOC_PORTAL_UI_LOCALE_CAPABILITY = "documentation-ui-locale-completeness";

/**
 * Pins the exact W-P123 capability version understood by the bridge.
 *
 * @constant {string}
 * @lang zh-CN 固定 bridge 理解的 W-P123 exact capability 版本。
 * @lang en Pins the exact W-P123 capability version understood by the bridge.
 */
export const HIA_JSDOC_PORTAL_UI_LOCALE_CAPABILITY_VERSION = "0.1.0-draft";

/**
 * Names the owner-neutral profile and surface used by hia-jsdoc Portal projection.
 *
 * @constant {string}
 * @lang zh-CN 为 hia-jsdoc Portal 投影提供稳定且不含目标仓身份的 profile/surface ID。
 * @lang en Provides the stable target-free profile/surface ID for hia-jsdoc Portal projection.
 */
export const HIA_JSDOC_PORTAL_UI_LOCALE_PROFILE_ID = "hia-jsdoc.portal-bridge";

/**
 * Declares the body-free report path emitted by the Portal owner.
 *
 * @constant {string}
 * @lang zh-CN 声明由 Portal owner 生成的无正文完整性报告路径。
 * @lang en Declares the body-free completeness-report path emitted by the Portal owner.
 */
export const HIA_JSDOC_PORTAL_UI_LOCALE_REPORT_PATH = "documentation-ui-locale-completeness.json";

/**
 * Creates the owner-neutral UI-locale capability descriptor embedded by the umbrella preset.
 *
 * @returns {object} <lang><zh-CN>仅含 capability、owner、surface、coverage 与 privacy metadata 的新 descriptor。</zh-CN><en>A fresh descriptor containing capability, owner, surface, coverage, and privacy metadata only.</en></lang>
 * @lang zh-CN 创建 umbrella preset 嵌入的 owner-neutral UI-locale capability descriptor；不携带译文、DOM、CSS 或目标身份。
 * @lang en Creates the owner-neutral UI-locale capability descriptor embedded by the umbrella preset; it carries no translations, DOM, CSS, or target identity.
 */
export function createHiaJsdocPortalUiLocaleBridge() {
  return {
    capability: HIA_JSDOC_PORTAL_UI_LOCALE_CAPABILITY,
    capabilityVersion: HIA_JSDOC_PORTAL_UI_LOCALE_CAPABILITY_VERSION,
    ownerPackage: "@hia-doc/renderer-html",
    profileId: HIA_JSDOC_PORTAL_UI_LOCALE_PROFILE_ID,
    surfaceId: HIA_JSDOC_PORTAL_UI_LOCALE_PROFILE_ID,
    reportPath: HIA_JSDOC_PORTAL_UI_LOCALE_REPORT_PATH,
    uiLocales: ["zh-CN", "en"],
    modes: ["interactive", "no-script"],
    channels: ["visible", "accessibility", "status"],
    privacy: "metadata-only"
  };
}

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
