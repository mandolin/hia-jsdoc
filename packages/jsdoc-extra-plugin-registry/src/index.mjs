import { HIA_JSDOC_EXTRA_PLUGIN_PHASES } from "@hia-doc/jsdoc-spec";

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
