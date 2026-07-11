import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { createHiaJsdocConfig } from "@hia-doc/jsdoc-preset";

const require = createRequire(import.meta.url);

export {
  HIA_JSDOC_CONFIG_JSON_SCHEMA,
  HIA_JSDOC_CONFIG_SCHEMA_ID,
  HIA_JSDOC_CONFIG_SCHEMA_VERSION
} from "./schema.mjs";
import { HIA_JSDOC_CONFIG_SCHEMA_ID, HIA_JSDOC_CONFIG_SCHEMA_VERSION } from "./schema.mjs";

export const HIA_JSDOC_RUNNER_VERSION = "0.0.0";
export const HIA_JSDOC_INPUT_KINDS = Object.freeze(["javascript-source", "javascript-module"]);
export const HIA_JSDOC_OUTPUT_KINDS = Object.freeze([
  "jsdoc-html",
  "jsdoc-search-index",
  "jsdoc-theme-metadata",
  "jsdoc-integration"
]);

const RESULT_CONTRACT = "documentation-producer-result";
const RESULT_CONTRACT_VERSION = "0.1.0-draft";
const PRODUCER_ID = "jsdoc";
const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

export function writeHiaJsdocConfig(filePath, options = {}) {
  const config = createHiaJsdocConfig(options);
  const absolutePath = path.resolve(options.cwd ?? process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return {
    path: absolutePath,
    config
  };
}

/**
 * 运行一次普通项目 JSDoc 生产链，并输出 HIA documentation producer result。
 * Runs one project-oriented JSDoc build and emits an HIA documentation producer result.
 *
 * @param {object} request HIA JSDoc project request.
 * @param {{ signal?: AbortSignal, reportProgress?: Function }} [context] Optional producer runtime context.
 * @returns {object} Documentation producer result.
 */
export function runHiaJsdocProject(request, context = {}) {
  const normalized = normalizeProjectRequest(request);
  fs.mkdirSync(normalized.outputDirectory, { recursive: true });

  if (context.signal?.aborted) {
    return createProducerResult("failed", [], [
      createDiagnostic("HIA_JSDOC_RUNNER_ABORTED", "HIA JSDoc runner was aborted before it started.", "error")
    ]);
  }

  context.reportProgress?.({
    phase: "extract",
    current: 0,
    total: normalized.inputs.length,
    message: "jsdoc"
  });

  const outputDirectoryRelative = relativeFromWorkspaceRoot(normalized.workspaceRoot, normalized.outputDirectory, "outputDirectory");
  const configPath = path.join(normalized.outputDirectory, ".hia-jsdoc", "jsdoc.conf.json");
  const integrationOutputFile = `${outputDirectoryRelative}/hia-integration.json`;
  const execution = runHiaJsdoc({
    cwd: normalized.workspaceRoot,
    configPath,
    mode: normalized.options.mode,
    source: {
      include: normalized.inputs.map((input) => input.path),
      includePattern: normalized.options.includePattern,
      excludePattern: normalized.options.excludePattern
    },
    destination: outputDirectoryRelative,
    integrationOutputFile,
    recurse: normalized.options.recurse,
    extraPlugins: normalized.options.extraPlugins,
    plugin: normalized.options.plugin,
    hia: normalized.options.hia,
    theme: normalized.options.theme,
    baseConfig: normalized.options.baseConfig
  });

  const diagnostics = [
    ...pluginDiagnosticsFromConfig(execution.config),
    ...(execution.ok ? [] : [
      createDiagnostic(
        "HIA_JSDOC_RUNNER_FAILED",
        execution.stderr || execution.stdout || "JSDoc CLI failed.",
        "error"
      )
    ])
  ];
  const artifacts = execution.ok
    ? collectArtifacts(normalized.outputDirectory, normalized.profileIds)
    : [];
  const status = diagnostics.some((diagnostic) => diagnostic.severity === "error")
    ? (artifacts.length > 0 ? "partial" : "failed")
    : "success";
  const result = createProducerResult(status, artifacts, diagnostics);

  if (normalized.options.writeResultManifest) {
    fs.writeFileSync(
      path.join(normalized.outputDirectory, "hia-jsdoc.producer-result.json"),
      `${JSON.stringify(result, null, 2)}\n`,
      "utf8"
    );
  }

  context.reportProgress?.({
    phase: "complete",
    current: normalized.inputs.length,
    total: normalized.inputs.length
  });

  return result;
}

/**
 * 读取 versioned HIA JSDoc JSON config 并转成 project runner request。
 * Loads a versioned HIA JSDoc JSON config and converts it into a project runner request.
 *
 * @param {string} configPath Config path relative to cwd or absolute.
 * @param {{ cwd?: string }} [options]
 * @returns {object} Normalized HIA JSDoc project request.
 */
export function loadHiaJsdocConfig(configPath, options = {}) {
  const absoluteConfigPath = path.resolve(options.cwd ?? process.cwd(), configPath);
  const config = JSON.parse(fs.readFileSync(absoluteConfigPath, "utf8"));
  assertRecord(config, "HIA JSDoc config must be a JSON object.");
  assertKnownKeys(config, ["$schema", "schemaVersion", "workspaceRoot", "outputDirectory", "inputs", "options", "profileIds"], "config");
  if (config.schemaVersion !== HIA_JSDOC_CONFIG_SCHEMA_VERSION) {
    throw new TypeError(`schemaVersion must be ${HIA_JSDOC_CONFIG_SCHEMA_VERSION}.`);
  }
  if (config.$schema !== undefined && config.$schema !== HIA_JSDOC_CONFIG_SCHEMA_ID) {
    throw new TypeError(`$schema must be ${HIA_JSDOC_CONFIG_SCHEMA_ID}.`);
  }

  const configDirectory = path.dirname(absoluteConfigPath);
  const workspaceDirectory = normalizeConfigDirectory(config.workspaceRoot ?? ".", "workspaceRoot");
  const outputDirectory = normalizeConfigDirectory(config.outputDirectory ?? "dist/hia-jsdoc", "outputDirectory");
  const workspaceRoot = path.resolve(configDirectory, workspaceDirectory);

  return normalizeProjectRequest({
    workspaceRoot,
    outputDirectory: path.resolve(workspaceRoot, outputDirectory),
    inputs: config.inputs,
    options: config.options,
    profileIds: config.profileIds
  });
}

export function runHiaJsdoc(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const configPath = options.configPath ?? "hia-jsdoc.conf.json";
  const written = writeHiaJsdocConfig(configPath, { ...options, cwd });
  const jsdocBin = require.resolve("jsdoc/jsdoc.js");
  const result = spawnSync(process.execPath, [jsdocBin, "-c", written.path], {
    cwd,
    encoding: "utf8",
    shell: false
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    configPath: written.path,
    config: written.config
  };
}

function normalizeProjectRequest(value) {
  assertRecord(value, "HIA JSDoc project request must be an object.");
  assertAbsoluteDirectory(value.workspaceRoot, "workspaceRoot");
  assertAbsoluteDirectory(value.outputDirectory, "outputDirectory");
  if (!Array.isArray(value.inputs) || value.inputs.length === 0) {
    throw new TypeError("inputs must be a non-empty array.");
  }

  const inputs = value.inputs.map((input, index) => {
    assertRecord(input, `inputs[${index}] must be an object.`);
    assertKnownKeys(input, ["kind", "path"], `inputs[${index}]`);
    const inputPath = normalizeSafeRelativePath(input.path, `inputs[${index}].path`);
    const kind = input.kind ?? inferHiaJsdocInputKind(inputPath);
    if (!HIA_JSDOC_INPUT_KINDS.includes(kind)) {
      throw new TypeError(`Unsupported HIA JSDoc input kind: ${kind}`);
    }
    return { kind, path: inputPath };
  });

  const runnerOptions = value.options ?? {};
  assertRecord(runnerOptions, "options must be an object.");
  const sourcesContentPolicy = runnerOptions.sourcesContentPolicy ?? "none";
  if (!["none", "reference", "embed"].includes(sourcesContentPolicy)) {
    throw new TypeError(`Unsupported sourcesContentPolicy: ${sourcesContentPolicy}`);
  }
  const profileIds = value.profileIds ?? ["jsdoc"];
  if (!Array.isArray(profileIds) || profileIds.length === 0 || profileIds.some((id) => typeof id !== "string" || !SAFE_ID_PATTERN.test(id))) {
    throw new TypeError("profileIds must be a non-empty array of lower-case identifiers.");
  }

  return {
    workspaceRoot: path.resolve(value.workspaceRoot),
    outputDirectory: path.resolve(value.outputDirectory),
    inputs,
    profileIds: [...profileIds],
    options: {
      mode: runnerOptions.mode ?? "both",
      includePattern: runnerOptions.includePattern ?? ".+\\.(mjs|cjs|js|jsx)$",
      excludePattern: runnerOptions.excludePattern ?? "(^|[/\\\\])_",
      recurse: runnerOptions.recurse ?? true,
      writeResultManifest: runnerOptions.writeResultManifest !== false,
      sourcesContentPolicy,
      extraPlugins: runnerOptions.extraPlugins ?? {},
      plugin: runnerOptions.plugin ?? {},
      hia: runnerOptions.hia ?? {},
      theme: runnerOptions.theme ?? {},
      baseConfig: runnerOptions.baseConfig ?? {}
    }
  };
}

function inferHiaJsdocInputKind(inputPath) {
  return String(inputPath).replaceAll("\\", "/").toLowerCase().endsWith(".mjs")
    ? "javascript-module"
    : "javascript-source";
}

function collectArtifacts(outputDirectory, profileIds) {
  const artifacts = [];
  if (fs.existsSync(path.join(outputDirectory, "index.html"))) {
    artifacts.push(artifact("jsdoc-html", "jsdoc-html", "index.html", "html", "text/html", profileIds));
  }
  if (fs.existsSync(path.join(outputDirectory, "search-index.json"))) {
    artifacts.push(artifact("jsdoc-search-index", "jsdoc-search-index", "search-index.json", "json", "application/json", profileIds));
  }
  if (fs.existsSync(path.join(outputDirectory, "hia-metadata.json"))) {
    artifacts.push(artifact("jsdoc-theme-metadata", "jsdoc-theme-metadata", "hia-metadata.json", "json", "application/json", profileIds));
  }
  if (fs.existsSync(path.join(outputDirectory, "hia-integration.json"))) {
    artifacts.push({
      ...artifact("jsdoc-integration", "jsdoc-integration", "hia-integration.json", "json", "application/json", profileIds),
      contract: "hia-jsdoc-integration",
      contractVersion: "0.1.0"
    });
  }
  return artifacts;
}

function pluginDiagnosticsFromConfig(config) {
  return (config?.opts?.hia?.umbrella?.extraPluginDiagnostics ?? []).map((diagnostic) => ({
    code: typeof diagnostic.code === "string" ? diagnostic.code : "HIA_JSDOC_PLUGIN_DIAGNOSTIC",
    message: typeof diagnostic.message === "string" ? diagnostic.message : "HIA JSDoc plugin diagnostic.",
    severity: ["error", "warning", "info"].includes(diagnostic.severity) ? diagnostic.severity : "warning",
    ...(diagnostic.data && typeof diagnostic.data === "object" ? { data: diagnostic.data } : {})
  }));
}

function createProducerResult(status, artifacts, diagnostics) {
  return {
    contract: RESULT_CONTRACT,
    contractVersion: RESULT_CONTRACT_VERSION,
    producer: {
      id: PRODUCER_ID,
      version: HIA_JSDOC_RUNNER_VERSION
    },
    status,
    artifacts,
    diagnostics
  };
}

function artifact(id, kind, artifactPath, language, mediaType, profileIds) {
  return {
    id,
    kind,
    path: artifactPath,
    language,
    mediaType,
    profileIds
  };
}

function createDiagnostic(code, message, severity) {
  return {
    code,
    message,
    severity
  };
}

function relativeFromWorkspaceRoot(workspaceRoot, targetPath, label) {
  const relative = path.relative(workspaceRoot, targetPath).replaceAll("\\", "/");
  if (!relative || relative.startsWith("../") || relative === ".." || path.isAbsolute(relative)) {
    throw new TypeError(`${label} must stay inside workspaceRoot for JSDoc execution.`);
  }
  return relative;
}

function normalizeSafeRelativePath(value, label) {
  if (typeof value !== "string" || !isSafeRelativePath(value)) {
    throw new TypeError(`${label} must be a safe relative path.`);
  }
  return value.replaceAll("\\", "/");
}

function isSafeRelativePath(value) {
  const normalized = String(value).replaceAll("\\", "/");
  return Boolean(normalized)
    && !path.posix.isAbsolute(normalized)
    && !path.win32.isAbsolute(value)
    && !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(normalized)
    && !normalized.split("/").includes("..");
}

function normalizeConfigDirectory(value, label) {
  if (typeof value !== "string" || path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) {
    throw new TypeError(`${label} must be relative to the config/project directory.`);
  }
  const normalized = value.replaceAll("\\", "/");
  if (!normalized || normalized.split("/").includes("..")) {
    throw new TypeError(`${label} must not escape its base directory.`);
  }
  return normalized;
}

function assertAbsoluteDirectory(value, label) {
  if (typeof value !== "string" || (!path.posix.isAbsolute(value) && !path.win32.isAbsolute(value))) {
    throw new TypeError(`${label} must be an absolute runtime path.`);
  }
}

function assertKnownKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new TypeError(`${label}.${key} is not supported.`);
    }
  }
}

function assertRecord(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(message);
  }
}
