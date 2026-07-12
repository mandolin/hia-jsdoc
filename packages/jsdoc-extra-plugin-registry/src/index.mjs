import { HIA_JSDOC_EXTRA_PLUGIN_PHASES } from "@hia-doc/jsdoc-spec";

/**
 * Normalizes user-supplied extra JSDoc plugin configuration into ordered bridge phases.
 *
 * @param {object} [input] <lang zh-CN>用户提供的 before/after 或 pre/post 插件配置。</lang><lang en>User supplied before/after or pre/post plugin configuration.</lang>
 * @returns {object} <lang zh-CN>规范化插件阶段、诊断列表和最终插件加载顺序。</lang><lang en>Normalized plugin phases, diagnostics, and final plugin load order.</lang>
 * @lang zh-CN 将使用者传入的额外 JSDoc 插件配置规范化为 umbrella bridge 可消费的有序阶段。
 * @lang en Normalizes user-supplied extra JSDoc plugin configuration into ordered umbrella bridge phases.
 */
export function normalizeExtraPluginRegistry(input = {}) {
  const diagnostics = [];
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

function normalizePluginEntry(entry, phase, index, diagnostics) {
  const rawModule = typeof entry === "string" ? entry : entry?.module ?? entry?.package;
  if (!rawModule || typeof rawModule !== "string") {
    diagnostics.push(createDiagnostic("HIA_JSDOC_PLUGIN_ENTRY_INVALID", `Plugin entry ${phase}[${index}] must provide a module string.`, { phase, index }));
    return null;
  }
  if (rawModule.includes("..") || /^[a-zA-Z]:[\\/]/.test(rawModule)) {
    diagnostics.push(createDiagnostic("HIA_JSDOC_PLUGIN_PATH_UNSAFE", `Plugin entry ${phase}[${index}] uses an unsafe module path.`, { phase, index, module: rawModule }));
    return null;
  }
  return {
    module: rawModule,
    phase,
    optional: Boolean(typeof entry === "object" && entry.optional),
    config: typeof entry === "object" && entry.config && typeof entry.config === "object" ? entry.config : {}
  };
}

function createDiagnostic(code, message, data = {}) {
  return {
    code,
    message,
    severity: "warning",
    data
  };
}
