import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { createHiaJsdocConfig } from "@hia-doc/jsdoc-preset";
import { validateJsdocDocSourceMap } from "./doc-source-map-validation.mjs";

const require = createRequire(import.meta.url);

export {
  HIA_JSDOC_CONFIG_JSON_SCHEMA,
  HIA_JSDOC_CONFIG_SCHEMA_ID,
  HIA_JSDOC_CONFIG_SCHEMA_VERSION,
  HIA_JSDOC_LEGACY_CONFIG_JSON_SCHEMA,
  HIA_JSDOC_LEGACY_CONFIG_SCHEMA_ID,
  HIA_JSDOC_LEGACY_CONFIG_SCHEMA_VERSION,
  getHiaJsdocConfigSchema
} from "./schema.mjs";
import { HIA_JSDOC_CONFIG_SCHEMA_ID, HIA_JSDOC_CONFIG_SCHEMA_VERSION, getHiaJsdocConfigSchema } from "./schema.mjs";

/**
 * Declares the runtime version of the HIA JSDoc runner package.
 *
 * @constant {string}
 * @lang zh-CN 声明 HIA JSDoc runner 包的运行时版本。
 * @lang en Declares the runtime version of the HIA JSDoc runner package.
 */
export const HIA_JSDOC_RUNNER_VERSION = "1.0.0";

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

const RESULT_CONTRACT = "documentation-producer-result";
/** @lang zh-CN 新构建采用已确认SDK结果1.0.0；不读取或重标保存的历史结果。 @lang en New builds use the confirmed SDK result 1.0.0 without reading or relabeling saved historical results. */
const RESULT_CONTRACT_VERSION = "1.0.0";
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
 * @returns {object} <lang><zh-CN>符合documentation producer result的公开安全结果；CLI失败不携带原始stdout/stderr。</zh-CN><en>A public-safe documentation producer result; CLI failures carry no raw stdout/stderr.</en></lang>
 * @throws {TypeError} <lang><zh-CN>请求路径、类型、重复profile id或最终合并输出不合法时，在创建/清理输出之前拒绝。</zh-CN><en>Rejects invalid request paths, types, duplicate profile ids or effective outputs before creating/cleaning output.</en></lang>
 * @lang zh-CN 运行一次面向项目的 JSDoc 生产链，并输出 HIA documentation producer result。
 * @lang en Runs one project-oriented JSDoc build and emits an HIA documentation producer result.
 */
export function runHiaJsdocProject(request, context = {}) {
  const normalized = normalizeProjectRequest(request);
  // <lang><zh-CN>任何创建或旧地图清理前，同时验证词法路径与已存在父目录的真实路径边界。</zh-CN><en>Before any creation or stale-map cleanup, verify both lexical containment and the real path of the existing parent.</en></lang>
  const outputDirectoryRelative = verifyOutputDirectoryBoundary(normalized.workspaceRoot, normalized.outputDirectory);
  // <lang><zh-CN>先计算最终配置，防止 baseConfig 后覆盖把已启用地图的关联工件写到本次构建之外。</zh-CN><en>Resolve the effective config first so a later baseConfig override cannot redirect an enabled map's paired artifact outside this build.</en></lang>
  const configPath = path.join(normalized.outputDirectory, ".hia-jsdoc", "jsdoc.conf.json");
  const integrationOutputFile = `${outputDirectoryRelative}/hia-integration.json`;
  const executionOptions = {
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
  };
  const effectiveConfig = createHiaJsdocConfig(executionOptions);
  // <lang><zh-CN>项目产物路径以请求输出根为基准；所有模式都核最终合并值，不能由baseConfig绕开请求边界。</zh-CN><en>Project artifact paths are relative to the requested output root; every mode checks the final merged values so baseConfig cannot bypass the request boundary.</en></lang>
  assertEffectiveProjectOutput(effectiveConfig, normalized);
  const docSourceMapEnabled = effectiveConfig.opts?.hia?.docSourceMap?.enabled === true;
  if (docSourceMapEnabled && (effectiveConfig.opts?.hia?.integration?.enabled !== true
    || effectiveConfig.opts?.hia?.integration?.outputFile !== integrationOutputFile
    || effectiveConfig.opts?.destination !== outputDirectoryRelative)) {
    throw new TypeError("The enabled documentation source map requires this build's fixed integration output and destination.");
  }

  if (context.signal?.aborted) {
    return createProducerResult("failed", [], [
      createDiagnostic("HIA_JSDOC_RUNNER_ABORTED", "HIA JSDoc runner was aborted before it started.", "error")
    ]);
  }

  fs.mkdirSync(normalized.outputDirectory, { recursive: true });
  // <lang><zh-CN>清除固定的旧地图文件，防止同一输出目录内本轮关闭开关时，旧 sidecar 被下游目录复制误发布；不递归删除目录。</zh-CN><en>Clear the fixed stale map file so disabling this build cannot leave a publishable prior sidecar in the same output directory; never recursively remove a directory.</en></lang>
  try {
    fs.rmSync(path.join(normalized.outputDirectory, "hia-doc-source-map.json"), { force: true });
  } catch {
    return createProducerResult("failed", [], [
      createDiagnostic("HIA_JSDOC_DOC_SOURCE_MAP_RESET_FAILED", "Could not prepare the documentation source map output.", "error")
    ]);
  }
  // <lang><zh-CN>把本次已创建输出目录的真实身份固定下来；进度回调和子进程期间的联接替换不能被视为同一构建目录。</zh-CN><en>Pin the physical identity of this created output directory; a junction replacement during progress callbacks or the child process is not the same build directory.</en></lang>
  const expectedOutputReal = fs.realpathSync(normalized.outputDirectory);
  const expectedOutputStat = fs.statSync(normalized.outputDirectory);

  context.reportProgress?.({
    phase: "extract",
    current: 0,
    total: normalized.inputs.length,
    message: "jsdoc"
  });
  assertOutputDirectoryUnchanged(normalized.workspaceRoot, normalized.outputDirectory, expectedOutputReal, expectedOutputStat);

  const execution = runHiaJsdoc(executionOptions);
  assertOutputDirectoryUnchanged(normalized.workspaceRoot, normalized.outputDirectory, expectedOutputReal, expectedOutputStat);
  const failedOutputDiagnostics = [];
  if (!execution.ok) {
    // <lang><zh-CN>CLI 失败可能发生在插件写图之后；该文件不属于成功工件，不能供目录级暂存复制。</zh-CN><en>The CLI may fail after the plugin wrote a map; that file is not a successful artifact and must not reach a directory-level staged copy.</en></lang>
    removeUntrustedDocSourceMap(path.join(normalized.outputDirectory, "hia-doc-source-map.json"), failedOutputDiagnostics);
  }

  const diagnostics = [
    ...pluginDiagnosticsFromConfig(execution.config),
    ...failedOutputDiagnostics,
    ...(execution.ok ? [] : [
      createDiagnostic(
        "HIA_JSDOC_RUNNER_FAILED",
        docSourceMapEnabled ? "JSDoc CLI failed while building the requested documentation source map." : "JSDoc CLI failed while building the requested documentation.",
        "error"
      )
    ])
  ];
  const artifacts = execution.ok
    ? collectArtifacts(
      normalized.outputDirectory,
      normalized.profileIds,
      diagnostics,
      execution.config.opts?.hia?.umbrella?.themeBridge?.presentation,
      docSourceMapEnabled
    )
    : [];
  // <lang><zh-CN>已确认SDK要求success至少有一个工件；真实CLI退出0仍须实际有交付工件。</zh-CN><en>The confirmed SDK requires at least one artifact for success; actual CLI exit zero still requires delivery artifacts.</en></lang>
  if (execution.ok && artifacts.length === 0) {
    diagnostics.push(createDiagnostic("HIA_JSDOC_OUTPUT_EMPTY", "JSDoc produced no documentation artifacts.", "error"));
  }
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
  assertOutputDirectoryUnchanged(normalized.workspaceRoot, normalized.outputDirectory, expectedOutputReal, expectedOutputStat);

  return result;
}

/**
 * Loads a versioned HIA JSDoc JSON config and converts it into a project runner request.
 *
 * @param {string} configPath <lang><zh-CN>相对于 cwd 或绝对路径的配置文件路径。</zh-CN><en>Config file path, relative to cwd or absolute.</en></lang>
 * @param {object} [options] <lang><zh-CN>可选加载选项；cwd 控制相对路径基准。</zh-CN><en>Optional loading options; cwd controls the base for relative paths.</en></lang>
 * @returns {object} <lang><zh-CN>规范化后的 HIA JSDoc project request。</zh-CN><en>The normalized HIA JSDoc project request.</en></lang>
 * @throws {TypeError} <lang><zh-CN>当 schemaVersion、$schema、路径或输入配置不符合 contract 时抛出。</zh-CN><en>Thrown when schemaVersion, $schema, paths, or input config violate the contract.</en></lang>
 * @throws {SyntaxError} <lang><zh-CN>无效JSON，错误正文不包含原文片段。</zh-CN><en>Invalid JSON, with no original excerpts in the error message.</en></lang>
 * @throws {Error} <lang><zh-CN>本地读取失败，固定错误不包含路径和原始cause。</zh-CN><en>Local read failure with a fixed error omitting paths and the original cause.</en></lang>
 * @lang zh-CN 读取 versioned HIA JSDoc JSON config，并转成 project runner request。
 * @lang en Loads a versioned HIA JSDoc JSON config and converts it into a project runner request.
 */
export function loadHiaJsdocConfig(configPath, options = {}) {
  // <lang><zh-CN>路径仅用于本地读取，不复制到公开异常；底层I/O失败与JSON语法失败保留不同错误类别。</zh-CN><en>The path is used locally without copying it into public exceptions; I/O and JSON syntax failures retain distinct error categories.</en></lang>
  const absoluteConfigPath = path.resolve(options.cwd ?? process.cwd(), configPath);
  let text;
  try {
    text = fs.readFileSync(absoluteConfigPath, "utf8");
  } catch {
    throw new Error("Could not read the HIA JSDoc configuration.");
  }
  // <lang><zh-CN>原生JSON错误可能包含输入片段，因此只保留固定SyntaxError，不附原始cause。</zh-CN><en>Native JSON errors can contain input excerpts; retain only a fixed SyntaxError without the original cause.</en></lang>
  let config;
  try {
    config = JSON.parse(text);
  } catch {
    throw new SyntaxError("HIA JSDoc configuration must be valid JSON.");
  }
  // <lang><zh-CN>精确读取验证原对象；请求另按文件目录基准规范化。</zh-CN><en>Exact reading validates the original object; requests are separately normalized against the file directory.</en></lang>
  readHiaJsdocConfig(config);
  return configToProjectRequest(config, path.dirname(absoluteConfigPath));
}

/**
 * @lang zh-CN 精确接纳当前或旧配置并返回同一对象；保持历史loader缺省行为，不将其当旧schema完全合规证明。
 * @lang en Admits exact current or legacy config and returns the same object; preserves historical loader defaults without claiming full historical schema conformance.
 * @param {object} config <lang><zh-CN>已解析配置，开放扩展保持既有接纳行为。</zh-CN><en>Parsed configuration; open extensions retain existing acceptance behavior.</en></lang>
 * @returns {object} <lang><zh-CN>原对象、原身份，无填值、写盘或插件执行。</zh-CN><en>Original object and identity, without filling defaults, writing files or executing plugins.</en></lang>
 * @throws {TypeError} <lang><zh-CN>身份、配对或运行输入错误，不回显私有值。</zh-CN><en>Invalid identity, pairing or runtime input, without echoing private values.</en></lang>
 */
export function readHiaJsdocConfig(config) {
  assertRecord(config, "HIA JSDoc config must be a JSON object.");
  assertKnownKeys(config, ["$schema", "schemaVersion", "workspaceRoot", "outputDirectory", "inputs", "options", "profileIds"], "config");
  // <lang><zh-CN>对象必须显式声明版本，不能借选择器的默认参数猜测身份。</zh-CN><en>Objects must explicitly declare a version rather than infer identity from selector defaults.</en></lang>
  if (typeof config.schemaVersion !== "string") throw new TypeError("A supported schemaVersion is required.");
  const schema = getHiaJsdocConfigSchema(config.schemaVersion);
  if (config.$schema !== undefined && config.$schema !== schema.$id) {
    throw new TypeError("The configuration $schema must match its exact schemaVersion.");
  }
  if (config.schemaVersion === HIA_JSDOC_CONFIG_SCHEMA_VERSION) {
    // <lang><zh-CN>新schema只对省略取默认；旧null缺省可读，但不得静默换号迁移。</zh-CN><en>New schema defaults apply only to omission; legacy null defaults remain readable but cannot silently migrate by relabeling.</en></lang>
    for (const field of ["workspaceRoot", "outputDirectory", "profileIds"]) {
      if (config[field] === null) throw new TypeError("Explicit null is not a configuration default.");
    }
    if (Array.isArray(config.inputs) && config.inputs.some((input) => input?.kind === null)) {
      throw new TypeError("Explicit null is not an input kind default.");
    }
  }
  configToProjectRequest(config, process.cwd());
  return config;
}

/**
 * @lang zh-CN 显式生成当前配置的独立JSON副本；保留可表示扩展与省略，不写盘、不原地改号。
 * @lang en Explicitly creates a detached current-config JSON copy, preserving representable extensions and omissions without writing files or relabeling input in place.
 * @param {object} config <lang><zh-CN>当前或精确旧配置。</zh-CN><en>Current or exact legacy configuration.</en></lang>
 * @returns {object} <lang><zh-CN>经当前规则复核的新对象；存在$schema时更新为匹配ID。</zh-CN><en>New object rechecked against current rules; an existing $schema is updated to the matching ID.</en></lang>
 * @throws {TypeError} <lang><zh-CN>无效配置、非JSON/循环扩展或新版无法无损接纳的旧值，不丢弃或强转。</zh-CN><en>Invalid config, non-JSON/cyclic extensions or legacy values the current version cannot admit losslessly; nothing is discarded or coerced.</en></lang>
 */
export function migrateHiaJsdocConfig(config) {
  // <lang><zh-CN>先证明JSON无损，避免stringify丢函数/undefined或把非有限数变null。</zh-CN><en>Prove lossless JSON first so stringify cannot drop functions/undefined or convert non-finite numbers to null.</en></lang>
  assertJsonConfigValue(config, new Set());
  readHiaJsdocConfig(config);
  // <lang><zh-CN>JSON值已核准，结构克隆保留负零等数值且不共享原嵌套对象。</zh-CN><en>After JSON-value admission, structural cloning preserves numeric values such as negative zero without sharing original nested objects.</en></lang>
  const migrated = structuredClone(config);
  migrated.schemaVersion = HIA_JSDOC_CONFIG_SCHEMA_VERSION;
  if (Object.hasOwn(migrated, "$schema")) migrated.$schema = HIA_JSDOC_CONFIG_SCHEMA_ID;
  return readHiaJsdocConfig(migrated);
}

/**
 * @lang zh-CN 证明JSON可无损表示，拒绝访问器、符号、特殊对象、稀疏数组和祖先循环。
 * @lang en Proves lossless JSON representation, rejecting accessors, symbols, special objects, sparse arrays and ancestor cycles.
 * @param {unknown} value <lang><zh-CN>当前节点，值/键不回显。</zh-CN><en>Current node; values/keys are not echoed.</en></lang>
 * @param {Set<object>} ancestors <lang><zh-CN>本次可变祖先集，共享的非循环对象可重复出现。</zh-CN><en>Mutable ancestors for this traversal; shared noncyclic objects may recur.</en></lang>
 * @returns {void} <lang><zh-CN>仅验证，不执行访问器或写盘。</zh-CN><en>Validation only, without invoking accessors or writing files.</en></lang>
 * @throws {TypeError} <lang><zh-CN>数据不能无损表示。</zh-CN><en>Data cannot be represented losslessly.</en></lang>
 */
function assertJsonConfigValue(value, ancestors) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return;
  if (typeof value !== "object" || ancestors.has(value) || (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))) {
    throw new TypeError("Configuration migration requires lossless JSON data.");
  }
  // <lang><zh-CN>描述符避免访问器副作用；数组length是唯一允许的非枚举自有属性。</zh-CN><en>Descriptors avoid accessor side effects; array length is the only permitted non-enumerable own property.</en></lang>
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors).filter((key) => !(Array.isArray(value) && key === "length"));
  if (keys.some((key) => typeof key !== "string" || !descriptors[key].enumerable || !Object.hasOwn(descriptors[key], "value"))
    || (Array.isArray(value) && (keys.length !== value.length || keys.some((key, index) => key !== String(index))))) {
    throw new TypeError("Configuration migration requires lossless JSON data.");
  }
  ancestors.add(value);
  for (const key of keys) assertJsonConfigValue(descriptors[key].value, ancestors);
  ancestors.delete(value);
}

/**
 * @lang zh-CN 按本地基准生成新运行请求，保留原配置；只计算路径，不读写文件。
 * @lang en Creates a runtime request against a local base while preserving config; computes paths without reading or writing files.
 * @param {object} config <lang><zh-CN>已核身份的配置。</zh-CN><en>Configuration with an admitted identity.</en></lang>
 * @param {string} configDirectory <lang><zh-CN>本地绝对解析基准。</zh-CN><en>Local absolute resolution base.</en></lang>
 * @returns {object} <lang><zh-CN>新的规范化请求。</zh-CN><en>New normalized request.</en></lang>
 * @throws {TypeError} <lang><zh-CN>运行输入验证失败。</zh-CN><en>Runtime input validation fails.</en></lang>
 */
function configToProjectRequest(config, configDirectory) {
  // <lang><zh-CN>保留旧目录/kind缺省及相对文件目录基准。</zh-CN><en>Preserve legacy directory/kind defaults and the config-file-relative base.</en></lang>
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

/**
 * @lang zh-CN 按既有schema类型准入并填缺省，不写文件或执行插件；未知值不回显，开放扩展处理保持。
 * @lang en Admits existing schema types and fills defaults without writing files or executing plugins; unknown values are not echoed and open-extension handling is preserved.
 * @param {object} value <lang><zh-CN>本地项目请求。</zh-CN><en>Local project request.</en></lang>
 * @returns {object} <lang><zh-CN>规范化绝对目录、显式输入及运行选项。</zh-CN><en>Normalized absolute directories, explicit inputs and execution options.</en></lang>
 * @throws {TypeError} <lang><zh-CN>目录、输入、已声明类型或唯一标识符错误。</zh-CN><en>Invalid directories, inputs, declared types or unique identifiers.</en></lang>
 */
function normalizeProjectRequest(value) {
  assertRecord(value, "HIA JSDoc project request must be an object.");
  assertAbsoluteDirectory(value.workspaceRoot, "workspaceRoot");
  assertAbsoluteDirectory(value.outputDirectory, "outputDirectory");
  if (!Array.isArray(value.inputs) || value.inputs.length === 0) {
    throw new TypeError("inputs must be a non-empty array.");
  }

  // <lang><zh-CN>输入只接受已有两类；未知值不进入错误正文，避免把来源身份当公开诊断。</zh-CN><en>Accept only the two existing input kinds; unknown values never enter error text as public source identities.</en></lang>
  const inputs = value.inputs.map((input, index) => {
    assertRecord(input, `inputs[${index}] must be an object.`);
    assertKnownKeys(input, ["kind", "path"], `inputs[${index}]`);
    const inputPath = normalizeSafeRelativePath(input.path, `inputs[${index}].path`);
    const kind = input.kind ?? inferHiaJsdocInputKind(inputPath);
    if (!HIA_JSDOC_INPUT_KINDS.includes(kind)) {
      throw new TypeError("Unsupported HIA JSDoc input kind.");
    }
    return { kind, path: inputPath };
  });

  // <lang><zh-CN>省略才采用缺省，显式null/错误类型按已声明schema拒绝；开放扩展字段保持原处理。</zh-CN><en>Only omission selects defaults; explicit null or invalid types are rejected according to the declared schema while open extensions retain existing handling.</en></lang>
  const runnerOptions = value.options === undefined ? {} : value.options;
  assertRecord(runnerOptions, "options must be an object.");
  for (const field of ["extraPlugins", "plugin", "theme", "baseConfig", "hia"]) {
    if (runnerOptions[field] !== undefined) assertRecord(runnerOptions[field], `options.${field} must be an object.`);
  }
  for (const field of ["includePattern", "excludePattern"]) {
    if (runnerOptions[field] !== undefined && (typeof runnerOptions[field] !== "string" || runnerOptions[field].length === 0)) {
      throw new TypeError(`options.${field} must be a non-empty string.`);
    }
  }
  for (const field of ["recurse", "writeResultManifest"]) {
    if (runnerOptions[field] !== undefined && typeof runnerOptions[field] !== "boolean") {
      throw new TypeError(`options.${field} must be a boolean.`);
    }
  }
  if (runnerOptions.mode !== undefined && !["standalone", "hiaIntegration", "both"].includes(runnerOptions.mode)) {
    throw new TypeError("Unsupported HIA JSDoc output mode.");
  }
  // <lang><zh-CN>源码策略是闭集，null不能被转换为默认none而掩盖无效显式声明。</zh-CN><en>The source-content policy is closed; null must not become default none and conceal an invalid explicit declaration.</en></lang>
  const sourcesContentPolicy = runnerOptions.sourcesContentPolicy === undefined ? "none" : runnerOptions.sourcesContentPolicy;
  if (!["none", "reference", "embed"].includes(sourcesContentPolicy)) {
    throw new TypeError("Unsupported sourcesContentPolicy.");
  }
  // <lang><zh-CN>配置已声明标识符唯一；重复项在建立产物元数据之前拒绝，不静默重排或去重。</zh-CN><en>Configuration already declares identifiers unique; reject duplicates before artifact metadata without silently reordering or deduplicating.</en></lang>
  const profileIds = value.profileIds ?? ["jsdoc"];
  if (!Array.isArray(profileIds) || profileIds.length === 0 || profileIds.some((id) => typeof id !== "string" || !SAFE_ID_PATTERN.test(id)) || new Set(profileIds).size !== profileIds.length) {
    throw new TypeError("profileIds must be a non-empty array of unique lower-case identifiers.");
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

/**
 * @lang zh-CN 写盘前核项目最终输出；仅约束本wrapper配置的输出，不沙箱化受信插件或低层CLI。
 * @lang en Checks effective project outputs before writes; constrains wrapper configuration, not trusted plugins or the low-level CLI through sandboxing.
 * @param {object} config <lang><zh-CN>按既有优先级合并后的JSDoc配置。</zh-CN><en>JSDoc configuration merged with existing precedence.</en></lang>
 * @param {object} request <lang><zh-CN>已核绝对工作区与输出根的请求。</zh-CN><en>Request with validated absolute workspace and output roots.</en></lang>
 * @returns {void} <lang><zh-CN>只读检查，无文件创建或清理。</zh-CN><en>Read-only check without creating or cleaning files.</en></lang>
 * @throws {TypeError} <lang><zh-CN>最终输出与请求不一致或启用值类型错误。</zh-CN><en>Effective output differs from the request or the enabled value has an invalid type.</en></lang>
 */
function assertEffectiveProjectOutput(config, request) {
  // <lang><zh-CN>不同词法形式可解析到同一输出；不允许转向另一个构建，即使它仍在工作区内。</zh-CN><en>Different lexical forms may resolve to the same output; redirecting to another build is forbidden even inside the workspace.</en></lang>
  const destination = config.opts?.destination;
  if (typeof destination !== "string" || !destination || path.resolve(request.workspaceRoot, destination) !== request.outputDirectory) {
    throw new TypeError("The project runner requires its requested output destination.");
  }
  // <lang><zh-CN>关闭integration时其未使用路径不产生写入；启用时只允许本构建固定文件。</zh-CN><en>Disabled integration does not write its unused path; enabled integration permits only this build's fixed file.</en></lang>
  const integration = config.opts?.hia?.integration;
  if (typeof integration?.enabled !== "boolean") throw new TypeError("The project integration enabled option must be a boolean.");
  if (integration.enabled && (typeof integration.outputFile !== "string" ||
      path.resolve(request.workspaceRoot, integration.outputFile) !== path.join(request.outputDirectory, "hia-integration.json"))) {
    throw new TypeError("The project runner requires its fixed integration output.");
  }
}

function inferHiaJsdocInputKind(inputPath) {
  return String(inputPath).replaceAll("\\", "/").toLowerCase().endsWith(".mjs")
    ? "javascript-module"
    : "javascript-source";
}

/**
 * @lang zh-CN 收集构建产物；呈现身份须匹配本次preset已有bridge，不引入主仓运行依赖或猜测版本。
 * @lang en Collects build artifacts; presentation identities must match this preset's existing bridge without a main-repository runtime dependency or inferred versions.
 * @param {string} outputDirectory 构建输出目录。 / Build output directory.
 * @param {string[]} profileIds 所属profile身份。 / Owning profile identities.
 * @param {object[]} diagnostics 接收固定安全产物错误的本次可变数组。 / This invocation's mutable array receiving fixed safe artifact errors.
 * @param {object} presentation 本次preset投影的呈现bridge身份。 / Presentation bridge identity projected by this preset.
 * @param {boolean} docSourceMapEnabled 本次显式地图开关。 / Explicit map switch for this invocation.
 * @returns {object[]} 已发现且身份配对的产物清单；不是完整profile语义校验。 / Discovered identity-paired artifacts, not full semantic profile validation.
 */
function collectArtifacts(outputDirectory, profileIds, diagnostics, presentation, docSourceMapEnabled) {
  // <lang><zh-CN>数组仅归本次构建，非法呈现工件不污染其它独立产物。</zh-CN><en>The array belongs to this build only; an invalid presentation artifact does not contaminate independent artifacts.</en></lang>
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
  if (docSourceMapEnabled) {
    // <lang><zh-CN>只收集本轮真实存在且身份正确的固定 sidecar；缺失或损坏时不留下虚假产物清单。</zh-CN><en>Collect only this invocation's existing fixed sidecar with the expected identity; missing or invalid output leaves no false artifact record.</en></lang>
    const mapPath = path.join(outputDirectory, "hia-doc-source-map.json");
    if (fs.existsSync(mapPath) && artifacts.some((item) => item.kind === "jsdoc-integration")) {
      const identity = readDocSourceMapArtifactIdentity(mapPath, path.join(outputDirectory, "hia-integration.json"), diagnostics);
      if (identity) artifacts.push({
        ...artifact("doc-source-map", "doc-source-map", "hia-doc-source-map.json", "json", "application/json", profileIds),
        ...identity
      });
    } else {
      // <lang><zh-CN>缺少 integration 时也不得留下孤立地图文件供目录级复制。</zh-CN><en>When integration is absent, do not leave an orphan map for directory-level copying.</en></lang>
      removeUntrustedDocSourceMap(mapPath, diagnostics);
      diagnostics.push(createDiagnostic(
        "HIA_JSDOC_DOC_SOURCE_MAP_MISSING",
        "The requested documentation source map or its integration artifact was not produced.",
        "error"
      ));
    }
  }
  if (fs.existsSync(path.join(outputDirectory, "documentation-presentation-profile.json"))) {
    // <lang><zh-CN>从实际产物核对身份后才登记，不能仅凭文件存在写死旧版本。</zh-CN><en>Record the identity only after checking the actual artifact; existence alone cannot justify a hard-coded legacy version.</en></lang>
    const identity = readPresentationArtifactIdentity(outputDirectory, presentation, diagnostics);
    if (identity) artifacts.push({
      ...artifact(
        "documentation-presentation-profile",
        "documentation-presentation-profile",
        "documentation-presentation-profile.json",
        "json",
        "application/json",
        profileIds
      ),
      ...identity
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
 * @lang zh-CN 在父进程独立核对固定地图的封闭结构、隐私与同轮 integration 引用；拒绝时使用不含路径或内容的诊断。
 * @lang en Independently checks the fixed map's closed structure, privacy and same-run integration references in the parent process; refusals use a diagnostic without path or content.
 * @param {string} mapPath 固定生成文件路径。 / Fixed generated file path.
 * @param {string} integrationPath 本轮固定配对文件路径。 / Fixed paired file path for this build.
 * @param {object[]} diagnostics 本次可变诊断数组。 / Mutable diagnostics for this invocation.
 * @returns {{contract:string,contractVersion:string}|undefined} 已核身份，或拒绝。 / Verified identity, or refusal.
 */
function readDocSourceMapArtifactIdentity(mapPath, integrationPath, diagnostics) {
  try {
    // <lang><zh-CN>两文件必须仍位于本轮真实输出根；拒绝插件或后处理创建的跨目录符号链接。</zh-CN><en>Both files must still reside in this build's real output root; reject cross-directory symlinks created by plugins or post-processing.</en></lang>
    const outputRoot = fs.realpathSync(path.dirname(mapPath));
    if (path.dirname(fs.realpathSync(mapPath)) === outputRoot
      && path.dirname(fs.realpathSync(integrationPath)) === outputRoot) {
      const value = JSON.parse(fs.readFileSync(mapPath, "utf8"));
      const integration = JSON.parse(fs.readFileSync(integrationPath, "utf8"));
      if (validateJsdocDocSourceMap(value, integration)) {
        return { contract: value.contract, contractVersion: value.contractVersion };
      }
    }
  } catch {
    // <lang><zh-CN>不回显异常或原文，统一返回固定公开安全诊断。</zh-CN><en>Never echo the exception or raw content; return a fixed public-safe diagnostic.</en></lang>
  }
  diagnostics.push(createDiagnostic(
    "HIA_JSDOC_DOC_SOURCE_MAP_INVALID",
    "The requested documentation source map failed artifact validation.",
    "error"
  ));
  removeUntrustedDocSourceMap(mapPath, diagnostics);
  return undefined;
}

/**
 * @lang zh-CN 仅删除固定的未获承认地图文件，不递归清理目录；失败时保留固定诊断。
 * @lang en Removes only the fixed unaccepted map file without recursive directory cleanup; failure leaves a fixed diagnostic.
 * @param {string} mapPath 本轮固定 sidecar 路径。 / This invocation's fixed sidecar path.
 * @param {object[]} diagnostics 本轮可变诊断数组。 / Mutable diagnostics for this invocation.
 * @returns {void} 不返回文件内容。 / Returns no file content.
 */
function removeUntrustedDocSourceMap(mapPath, diagnostics) {
  try {
    fs.rmSync(mapPath, { force: true });
  } catch {
    diagnostics.push(createDiagnostic(
      "HIA_JSDOC_DOC_SOURCE_MAP_CLEANUP_FAILED",
      "Could not remove the unaccepted documentation source map output.",
      "error"
    ));
  }
}

/**
 * @lang zh-CN 读取固定生成工件的最小身份并与bridge配对；不校验整个中性profile、不读取源码或回显异常。
 * @lang en Reads a fixed generated artifact's minimal identity and pairs it with the bridge; does not validate the whole neutral profile, read source or echo exceptions.
 * @param {string} outputDirectory 本次生成目录。 / This build's output directory.
 * @param {object} expected 由既有preset提供的预期bridge身份。 / Expected bridge identity from the existing preset.
 * @param {object[]} diagnostics 本次诊断数组，失败追加固定记录。 / Current diagnostics, receiving a fixed record on failure.
 * @returns {{contract:string,contractVersion:string}|undefined} 已配对身份或无局部记录的拒绝。 / Paired identity or refusal without a partial record.
 */
function readPresentationArtifactIdentity(outputDirectory, expected, diagnostics) {
  try {
    // <lang><zh-CN>只解析JSON数据，不执行hooks；完整语义校验仍由契约owner与独立消费证据负责。</zh-CN><en>Parse JSON data only without hooks; full semantic validation remains with the contract owner and independent consumer evidence.</en></lang>
    const value = JSON.parse(fs.readFileSync(path.join(outputDirectory, "documentation-presentation-profile.json"), "utf8"));
    if (value && typeof value === "object" && !Array.isArray(value)
      && value.contract === "documentation-presentation-profile" && value.contract === expected?.contract
      && (value.contractVersion === "1.0.0" || value.contractVersion === "0.1.0-draft")
      && value.contractVersion === expected?.contractVersion) {
      return { contract: value.contract, contractVersion: value.contractVersion };
    }
  } catch {
    // <lang><zh-CN>不传播文件异常、内容或绝对路径；下面统一产生安全的产物身份错误。</zh-CN><en>Do not propagate file exceptions, contents or absolute paths; emit one safe artifact-identity error below.</en></lang>
  }
  diagnostics.push(createDiagnostic("HIA_JSDOC_PRESENTATION_ARTIFACT_INVALID", "Presentation artifact identity is unreadable, unsupported or does not match its theme bridge.", "error"));
  return undefined;
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
  // <lang><zh-CN>地图开关只允许布尔值，输出名由插件固定，拒绝任意路径注入。</zh-CN><en>The map switch accepts only a boolean; the plugin fixes the output name, rejecting arbitrary path injection.</en></lang>
  if (value.docSourceMap !== undefined) {
    assertRecord(value.docSourceMap, "options.hia.docSourceMap must be an object.");
    assertKnownKeys(value.docSourceMap, ["enabled"], "options.hia.docSourceMap");
    if (typeof value.docSourceMap.enabled !== "boolean") {
      throw new TypeError("options.hia.docSourceMap.enabled must be a boolean.");
    }
  }
  // <lang><zh-CN>presentation 只接受两个中性选择字段，不吸收 owner DOM/CSS 配置。</zh-CN><en>Presentation accepts only the two neutral selection fields and absorbs no owner DOM/CSS configuration.</en></lang>
  const presentation = value.presentation === undefined ? {} : value.presentation;
  assertRecord(presentation, "options.hia.presentation must be an object.");
  assertKnownKeys(presentation, ["pageMode", "sourceMode"], "options.hia.presentation");
  if (presentation.pageMode !== undefined && !["multi-page", "single-page"].includes(presentation.pageMode)) {
    throw new TypeError("Unsupported presentation pageMode.");
  }
  if (presentation.sourceMode !== undefined && !["fetch", "embed", "link", "none"].includes(presentation.sourceMode)) {
    throw new TypeError("Unsupported presentation sourceMode.");
  }
  // <lang><zh-CN>theme 的其他既有字段保持开放；只验证新增 scheme 与非空 skin selection。</zh-CN><en>Other existing theme fields remain open; only the new scheme and non-empty skin selection are validated.</en></lang>
  const theme = value.theme === undefined ? {} : value.theme;
  assertRecord(theme, "options.hia.theme must be an object.");
  if (theme.scheme !== undefined && !["dark", "light", "system"].includes(theme.scheme)) {
    throw new TypeError("Unsupported theme scheme.");
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

/**
 * @lang zh-CN 在写入前验证输出目录既在工作区词法范围内，也不会经现有联接或符号链接落到外部。
 * @lang en Before writing, verifies that the output is lexically inside the workspace and cannot escape through an existing junction or symlink.
 * @param {string} workspaceRoot 已存在的工作区根。 / Existing workspace root.
 * @param {string} outputDirectory 候选输出目录。 / Candidate output directory.
 * @returns {string} 安全的工作区相对目录。 / Safe workspace-relative directory.
 * @throws {TypeError} 工作区或真实输出边界不合法。 / Invalid workspace or physical output boundary.
 */
function verifyOutputDirectoryBoundary(workspaceRoot, outputDirectory) {
  // <lang><zh-CN>先拒绝明显越界，再解析现有的最近祖先，避免在路径验证前创建或删除文件。</zh-CN><en>Reject obvious lexical escapes, then resolve the nearest existing ancestor before creating or removing any file.</en></lang>
  const relativeOutput = relativeFromWorkspaceRoot(workspaceRoot, outputDirectory, "outputDirectory");
  let realWorkspaceRoot;
  let existingAncestor = outputDirectory;
  try {
    realWorkspaceRoot = fs.realpathSync(workspaceRoot);
    while (!fs.existsSync(existingAncestor)) {
      const parent = path.dirname(existingAncestor);
      if (parent === existingAncestor) throw new TypeError("outputDirectory has no existing ancestor.");
      existingAncestor = parent;
    }
    const realAncestor = fs.realpathSync(existingAncestor);
    const physicalTarget = path.resolve(realAncestor, path.relative(existingAncestor, outputDirectory));
    const physicalRelative = path.relative(realWorkspaceRoot, physicalTarget);
    if (!physicalRelative || physicalRelative === ".." || physicalRelative.startsWith(`..${path.sep}`)
      || path.isAbsolute(physicalRelative)) {
      throw new TypeError("outputDirectory must stay inside workspaceRoot for JSDoc execution.");
    }
  } catch {
    // <lang><zh-CN>不回显真实路径或系统异常；调用方得到稳定的边界拒绝。</zh-CN><en>Do not expose real paths or system errors; callers receive a stable boundary refusal.</en></lang>
    throw new TypeError("outputDirectory must stay inside workspaceRoot for JSDoc execution.");
  }
  return relativeOutput;
}

/**
 * @lang zh-CN 在可重入回调及子进程边界后重新证明输出仍是本轮创建的同一目录，不把替换后的联接当作成功产物。
 * @lang en Re-proves after reentrant callbacks and the child process that output remains the same directory created for this run, never accepting a replaced junction as successful output.
 * @param {string} workspaceRoot 工作区根。 / Workspace root.
 * @param {string} outputDirectory 本轮输出目录。 / This build's output directory.
 * @param {string} expectedReal 创建时真实路径。 / Real path at creation.
 * @param {object} expectedStat 创建时目录的 stat 身份，使用 dev 与 ino。 / Directory stat identity at creation, using dev and ino.
 * @returns {void} 身份未变时无返回值。 / No return when identity is unchanged.
 * @throws {TypeError} 目录越界或身份被替换。 / Directory escape or replacement.
 */
function assertOutputDirectoryUnchanged(workspaceRoot, outputDirectory, expectedReal, expectedStat) {
  try {
    verifyOutputDirectoryBoundary(workspaceRoot, outputDirectory);
    const actualStat = fs.statSync(outputDirectory);
    if (fs.realpathSync(outputDirectory) !== expectedReal || !actualStat.isDirectory()
      || actualStat.dev !== expectedStat.dev || actualStat.ino !== expectedStat.ino) {
      throw new TypeError("output directory changed");
    }
  } catch {
    throw new TypeError("JSDoc outputDirectory changed during this build.");
  }
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

/**
 * @lang zh-CN 对既有闭集对象拒绝未知键，错误只使用调用点固定标签而不反射用户键。
 * @lang en Rejects unknown keys in existing closed objects, using only the call site's fixed label without reflecting user keys.
 * @param {object} value <lang><zh-CN>已准入对象。</zh-CN><en>Admitted object.</en></lang>
 * @param {string[]} allowed <lang><zh-CN>已有允许键。</zh-CN><en>Existing allowed keys.</en></lang>
 * @param {string} label <lang><zh-CN>实现提供的固定字段位置。</zh-CN><en>Fixed field location supplied by the implementation.</en></lang>
 * @returns {void} <lang><zh-CN>只读检查。</zh-CN><en>Read-only check.</en></lang>
 * @throws {TypeError} <lang><zh-CN>存在未知键。</zh-CN><en>An unknown key exists.</en></lang>
 */
function assertKnownKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new TypeError(`${label} contains an unsupported field.`);
    }
  }
}

function assertRecord(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(message);
  }
}
