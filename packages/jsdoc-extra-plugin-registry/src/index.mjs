import { HIA_JSDOC_EXTRA_PLUGIN_PHASES } from "@hia-doc/jsdoc-spec";

/**
 * Normalizes user-supplied extra JSDoc plugin configuration into ordered bridge phases.
 *
 * @param {object} [input] <lang><zh-CN>用户提供的 before/after 或 pre/post 插件配置。</zh-CN><en>User supplied before/after or pre/post plugin configuration.</en></lang>
 * @returns {object} <lang><zh-CN>规范化插件阶段、诊断列表和最终插件加载顺序。</zh-CN><en>Normalized plugin phases, diagnostics, and final plugin load order.</en></lang>
 * @lang zh-CN 将使用者传入的额外 JSDoc 插件配置规范化为 umbrella bridge 可消费的有序阶段。
 * @lang en Normalizes user-supplied extra JSDoc plugin configuration into ordered umbrella bridge phases.
 */
export function normalizeExtraPluginRegistry(input = {}) {
  // <lang><zh-CN>诊断只承载固定阶段/索引，原路径与配置不得进入可发布摘要。</zh-CN><en>Diagnostics carry only fixed phases/indices; original paths and configuration must not enter publishable summaries.</en></lang>
  const diagnostics = [];
  // <lang><zh-CN>规范名称优先于兼容别名；保持输入顺序及重复项，不在注册阶段执行模块。</zh-CN><en>Canonical names take precedence over compatibility aliases; preserve order and duplicates without executing modules during registration.</en></lang>
  const before = normalizePluginList(input.before ?? input.pre ?? [], "before", diagnostics);
  const after = normalizePluginList(input.after ?? input.post ?? [], "after", diagnostics);

  return {
    before,
    after,
    diagnostics,
    order: [
      ...before.map((plugin) => plugin.module),
      "hia-jsdoc-plugin",
      ...after.map((plugin) => plugin.module)
    ]
  };
}

/**
 * @lang zh-CN 将单阶段声明转为顺序列表，无效项写固定诊断；不查模块存在性。
 * @lang en Converts one phase declaration into an ordered list with fixed diagnostics for invalid entries; does not check module existence.
 * @param {unknown} value 阶段声明。 / Phase declaration.
 * @param {string} phase 实现给定的阶段。 / Implementation-supplied phase.
 * @param {object[]} diagnostics 本轮可变诊断。 / Mutable diagnostics for this invocation.
 * @returns {object[]} 合法条目列表。 / Admitted entry list.
 */
function normalizePluginList(value, phase, diagnostics) {
  if (!HIA_JSDOC_EXTRA_PLUGIN_PHASES.includes(phase)) {
    diagnostics.push(createDiagnostic("HIA_JSDOC_PLUGIN_PHASE_UNSUPPORTED", `Unsupported plugin phase: ${phase}`, { phase }));
    return [];
  }
  if (!Array.isArray(value)) {
    diagnostics.push(createDiagnostic("HIA_JSDOC_PLUGIN_LIST_INVALID", `Plugin phase ${phase} must be an array.`, { phase }));
    return [];
  }

  return value.map((entry, index) => normalizePluginEntry(entry, phase, index, diagnostics)).filter(Boolean);
}

/**
 * @lang zh-CN 读取一个受信本地插件声明；只作既有词法筛选，不承诺文件系统隔离。
 * @lang en Reads a trusted local plugin declaration; existing lexical filtering is not filesystem isolation.
 * @param {unknown} entry 条目，配置对象保留引用。 / Entry whose config object retains its reference.
 * @param {string} phase 已知阶段。 / Known phase.
 * @param {number} index 从零起索引。 / Zero-based index.
 * @param {object[]} diagnostics 本轮可变诊断。 / Mutable diagnostics for this invocation.
 * @returns {object|null} 合法声明或拒绝。 / Admitted declaration or refusal.
 */
function normalizePluginEntry(entry, phase, index, diagnostics) {
  // <lang><zh-CN>module优先package别名；值仅在本地成功声明中保留，拒绝诊断不复制它。</zh-CN><en>Module precedes the package alias; retain it only in admitted local declarations, never in refusal diagnostics.</en></lang>
  const rawModule = typeof entry === "string" ? entry : entry?.module ?? entry?.package;
  if (!rawModule || typeof rawModule !== "string") {
    diagnostics.push(createDiagnostic("HIA_JSDOC_PLUGIN_ENTRY_INVALID", `Plugin entry ${phase}[${index}] must provide a module string.`, { phase, index }));
    return null;
  }
  if (rawModule.includes("..") || /^[a-zA-Z]:[\\/]/.test(rawModule)) {
    diagnostics.push(createDiagnostic("HIA_JSDOC_PLUGIN_PATH_UNSAFE", `Plugin entry ${phase}[${index}] uses an unsafe module path.`, { phase, index }));
    return null;
  }
  return {
    module: rawModule,
    phase,
    optional: Boolean(typeof entry === "object" && entry.optional),
    config: typeof entry === "object" && entry.config && typeof entry.config === "object" ? entry.config : {}
  };
}

/**
 * @lang zh-CN 构造固定warning；参数由实现提供，不接原始路径或异常。
 * @lang en Creates a fixed warning from implementation-supplied fields, never raw paths or exceptions.
 * @param {string} code 稳定码。 / Stable code.
 * @param {string} message 固定摘要。 / Fixed summary.
 * @param {object} [data={}] 阶段与索引。 / Phase and index.
 * @returns {object} 新诊断对象。 / New diagnostic object.
 */
function createDiagnostic(code, message, data = {}) {
  return {
    code,
    message,
    severity: "warning",
    data
  };
}
