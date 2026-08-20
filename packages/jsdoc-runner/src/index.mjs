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

/**
 * Declares the runtime version of the HIA JSDoc runner package.
 *
 * @constant {string}
 * @lang zh-CN 声明 HIA JSDoc runner 包的运行时版本。
 * @lang en Declares the runtime version of the HIA JSDoc runner package.
 */
export const HIA_JSDOC_RUNNER_VERSION = "0.0.0";

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
  "documentation-presentation-profile",
  "jsdoc-page-map"
]);

const RESULT_CONTRACT = "documentation-producer-result";
const RESULT_CONTRACT_VERSION = "0.1.0-draft";
const PRODUCER_ID = "jsdoc";
const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * Writes a generated HIA JSDoc config file and returns both the path and config object.
 *
 * @param {string} filePath <lang><zh-CN>相对于 cwd 或绝对路径的目标配置文件路径。</zh-CN><en>Target config file path, relative to cwd or absolute.</en></lang>
 * @param {object} [options] <lang><zh-CN>传递给 HIA JSDoc preset 的选项；cwd 控制相对路径基准。</zh-CN><en>Options passed to the HIA JSDoc preset; cwd controls the base for relative paths.</en></lang>
 * @returns {{ path: string, config: object }} <lang><zh-CN>写入后的绝对路径与生成配置对象。</zh-CN><en>The written absolute path and generated config object.</en></lang>
 * @throws {TypeError} <lang><zh-CN>当 preset 选项无法规范化时抛出。</zh-CN><en>Thrown when preset options cannot be normalized.</en></lang>
 * @lang zh-CN 写入生成的 HIA JSDoc config 文件，并返回路径和配置对象。
 * @lang en Writes a generated HIA JSDoc config file and returns both the path and config object.
 */
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
 * Runs one project-oriented JSDoc build and emits an HIA documentation producer result.
 *
 * @param {object} request <lang><zh-CN>HIA JSDoc project request，包含 workspaceRoot、outputDirectory、inputs 与 options。</zh-CN><en>HIA JSDoc project request containing workspaceRoot, outputDirectory, inputs, and options.</en></lang>
 * @param {object} [context] <lang><zh-CN>可选 producer runtime context，用于中断与进度回调。</zh-CN><en>Optional producer runtime context for cancellation and progress callbacks.</en></lang>
 * @returns {object} <lang><zh-CN>符合 documentation producer result contract 的运行结果。</zh-CN><en>A runtime result that follows the documentation producer result contract.</en></lang>
 * @throws {TypeError} <lang><zh-CN>当 request 的路径、输入类型或 profile id 不合法时抛出。</zh-CN><en>Thrown when request paths, input kinds, or profile ids are invalid.</en></lang>
 * @lang zh-CN 运行一次面向项目的 JSDoc 生产链，并输出 HIA documentation producer result。
 * @lang en Runs one project-oriented JSDoc build and emits an HIA documentation producer result.
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
 * Loads a versioned HIA JSDoc JSON config and converts it into a project runner request.
 *
 * @param {string} configPath <lang><zh-CN>相对于 cwd 或绝对路径的配置文件路径。</zh-CN><en>Config file path, relative to cwd or absolute.</en></lang>
 * @param {object} [options] <lang><zh-CN>可选加载选项；cwd 控制相对路径基准。</zh-CN><en>Optional loading options; cwd controls the base for relative paths.</en></lang>
 * @returns {object} <lang><zh-CN>规范化后的 HIA JSDoc project request。</zh-CN><en>The normalized HIA JSDoc project request.</en></lang>
 * @throws {TypeError} <lang><zh-CN>当 schemaVersion、$schema、路径或输入配置不符合 contract 时抛出。</zh-CN><en>Thrown when schemaVersion, $schema, paths, or input config violate the contract.</en></lang>
 * @lang zh-CN 读取 versioned HIA JSDoc JSON config，并转成 project runner request。
 * @lang en Loads a versioned HIA JSDoc JSON config and converts it into a project runner request.
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

/**
 * Executes the JSDoc CLI through the generated HIA JSDoc config.
 *
 * @param {object} [options] <lang><zh-CN>JSDoc 执行选项、preset 覆盖项和 configPath/cwd。</zh-CN><en>JSDoc execution options, preset overrides, and configPath/cwd.</en></lang>
 * @returns {object} <lang><zh-CN>包含退出状态、stdout/stderr、写入配置路径和配置对象的同步执行结果。</zh-CN><en>A synchronous execution result containing exit status, stdout/stderr, written config path, and config object.</en></lang>
 * @throws {TypeError} <lang><zh-CN>当配置生成过程无法规范化用户选项时抛出。</zh-CN><en>Thrown when config generation cannot normalize user options.</en></lang>
 * @lang zh-CN 通过生成的 HIA JSDoc config 执行 JSDoc CLI。
 * @lang en Executes the JSDoc CLI through the generated HIA JSDoc config.
 */
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
      hia: normalizeHiaOptions(runnerOptions.hia ?? {}),
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
  if (fs.existsSync(path.join(outputDirectory, "documentation-presentation-profile.json"))) {
    artifacts.push({
      ...artifact(
        "documentation-presentation-profile",
        "documentation-presentation-profile",
        "documentation-presentation-profile.json",
        "json",
        "application/json",
        profileIds
      ),
      contract: "documentation-presentation-profile",
      contractVersion: "0.1.0-draft"
    });
  }
  if (fs.existsSync(path.join(outputDirectory, "hia-page-map.json"))) {
    artifacts.push({
      ...artifact("jsdoc-page-map", "jsdoc-page-map", "hia-page-map.json", "json", "application/json", profileIds),
      contract: "jsdoc-theme-hia/page-map",
      contractVersion: "0.1.0"
    });
  }
  return artifacts;
}

/**
 * @lang zh-CN
 * 规范化 runner 传给 JPHS/JTH 的 HIA options；只校验本周期新增的 closed presentation/theme selection，其他既有配置原样保留。
 *
 * @lang en
 * Normalizes HIA options passed from the runner to JPHS/JTH; it validates only the newly closed presentation/theme
 * selections and preserves other existing configuration.
 *
 * @param {object} value HIA options 候选值。 / Candidate HIA options.
 * @returns {object} shallow-cloned normalized options。 / Shallow-cloned normalized options.
 * @throws {TypeError} 当 page/source/scheme/skin 选择无效。 / When page/source/scheme/skin selections are invalid.
 */
function normalizeHiaOptions(value) {
  assertRecord(value, "options.hia must be an object.");
  // <lang><zh-CN>presentation 只接受两个中性选择字段，不吸收 owner DOM/CSS 配置。</zh-CN><en>Presentation accepts only the two neutral selection fields and absorbs no owner DOM/CSS configuration.</en></lang>
  const presentation = value.presentation ?? {};
  assertRecord(presentation, "options.hia.presentation must be an object.");
  assertKnownKeys(presentation, ["pageMode", "sourceMode"], "options.hia.presentation");
  if (presentation.pageMode !== undefined && !["multi-page", "single-page"].includes(presentation.pageMode)) {
    throw new TypeError(`Unsupported presentation pageMode: ${presentation.pageMode}`);
  }
  if (presentation.sourceMode !== undefined && !["fetch", "embed", "link", "none"].includes(presentation.sourceMode)) {
    throw new TypeError(`Unsupported presentation sourceMode: ${presentation.sourceMode}`);
  }
  // <lang><zh-CN>theme 的其他既有字段保持开放；只验证新增 scheme 与非空 skin selection。</zh-CN><en>Other existing theme fields remain open; only the new scheme and non-empty skin selection are validated.</en></lang>
  const theme = value.theme ?? {};
  assertRecord(theme, "options.hia.theme must be an object.");
  if (theme.scheme !== undefined && !["dark", "light", "system"].includes(theme.scheme)) {
    throw new TypeError(`Unsupported theme scheme: ${theme.scheme}`);
  }
  if (theme.skin !== undefined && (typeof theme.skin !== "string" || !theme.skin.trim())) {
    throw new TypeError("theme.skin must be a non-empty string when provided.");
  }

  return {
    ...value,
    presentation: {
      pageMode: presentation.pageMode ?? "multi-page",
      sourceMode: presentation.sourceMode ?? "fetch"
    },
    theme: {
      ...theme,
      skin: theme.skin ?? "classic",
      scheme: theme.scheme ?? "system"
    }
  };
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
