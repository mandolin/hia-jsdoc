/**
 * @lang zh-CN 在 JSDoc 父进程清单阶段独立核验插件当前的封闭源码映射形状；不加载源码或信任子进程给出的工件身份。
 * @lang en Independently validates the current closed JSDoc source-map writer profile at parent inventory time without loading sources or trusting child-reported identity.
 */
import path from "node:path";

/** @lang zh-CN 当前插件只会发布四种 JavaScript 扩展名的已核文件。 @lang en The current plugin publishes verified files with only these four JavaScript extensions. */
const JS_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx"]);
/** @lang zh-CN 插件版本只承担机器身份，拒绝额外自由文本进入公开地图。 @lang en The plugin version is a machine identity, so free text cannot enter the public map through it. */
const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/;

/**
 * @lang zh-CN 要求 JSON 普通对象的字段集合精确一致，拒绝任意层级的未预期正文或路径扩展。
 * @lang en Requires an exact key set on a plain JSON object, rejecting unexpected content or path extensions at every level.
 * @param {unknown} value 待核值。 / Candidate value.
 * @param {string[]} keys 当前 writer 固定字段。 / Fixed keys from the current writer.
 * @returns {boolean} 是否为精确的普通对象。 / Whether the object has exactly those keys.
 */
function hasExactKeys(value, keys) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

/**
 * @lang zh-CN 仅接受本地安全相对文件路径，并保留与插件生成 source ID 相同的 Unicode 可逆性条件。
 * @lang en Accepts only safe local relative file paths with the same reversible Unicode condition used by the plugin's source IDs.
 * @param {unknown} candidate 待核路径。 / Candidate path.
 * @returns {boolean} 路径是否可安全公开。 / Whether the path is safe to publish.
 */
function isSafeRelativePath(candidate) {
  if (typeof candidate !== "string" || !candidate || path.isAbsolute(candidate) || path.win32.isAbsolute(candidate) ||
    /[\u0000-\u001f\u007f]/u.test(candidate)) return false;
  // <lang><zh-CN>统一两平台分隔符后拒绝越界段、空段和 Windows 流/盘符分隔符。</zh-CN><en>Normalize both platform separators, then reject traversal, empty segments, and Windows stream or drive separators.</en></lang>
  if (candidate.replaceAll("\\", "/").split("/").some((segment) => !segment || segment === "." || segment === ".." || segment.includes(":"))) return false;
  try {
    encodeURIComponent(candidate);
    return true;
  } catch {
    // <lang><zh-CN>孤立代理项无法生成可逆身份。</zh-CN><en>An unpaired surrogate cannot produce a reversible identity.</en></lang>
    return false;
  }
}

/**
 * @lang zh-CN 核对固定的单个 JSDoc integration 工件身份，禁止旁路工件和正文属性。
 * @lang en Checks the one fixed JSDoc integration artifact identity and rejects side artifacts or embedded content.
 * @param {unknown} artifacts 工件声明。 / Artifact declarations.
 * @returns {boolean} 声明是否完全匹配 writer。 / Whether declarations exactly match the writer.
 */
function validateArtifacts(artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length !== 1) return false;
  const artifact = artifacts[0];
  return hasExactKeys(artifact, ["id", "kind", "path", "format"]) &&
    artifact.id === "artifact:jsdoc-integration" && artifact.kind === "jsdoc-integration" &&
    artifact.path === "hia-integration.json" && isSafeRelativePath(artifact.path) && artifact.format === "json";
}

/**
 * @lang zh-CN 检查每份源码的安全相对路径、由路径导出的唯一身份和无正文策略。
 * @lang en Checks each source's safe relative path, unique path-derived identity, and content-free policy.
 * @param {unknown} sources 源声明列表。 / Source declarations.
 * @returns {Set<string>|null} 有效 ID 集，失败时为空值。 / Valid ID set, or null on failure.
 */
function validateSources(sources) {
  if (!Array.isArray(sources)) return null;
  const ids = new Set();
  const paths = new Set();
  for (const source of sources) {
    if (!hasExactKeys(source, ["id", "kind", "path", "language", "role", "sourcesContentPolicy"]) ||
      !isSafeRelativePath(source.path) || !JS_EXTENSIONS.has(path.extname(source.path).toLowerCase()) ||
      source.id !== `source:${encodeURIComponent(source.path)}` || ids.has(source.id) || paths.has(source.path) ||
      source.kind !== "javascript-source" || source.language !== "javascript" || source.role !== "original" ||
      source.sourcesContentPolicy !== "none") return null;
    ids.add(source.id);
    paths.add(source.path);
  }
  return ids;
}

/**
 * @lang zh-CN 核对一基 UTF-16 排除终点的真实非空区间；不从源码文本推断额外精度。
 * @lang en Checks a nonempty one-based UTF-16 range with an exclusive end, without inferring further precision from source text.
 * @param {unknown} range 范围对象。 / Range object.
 * @returns {boolean} 范围是否符合本 writer。 / Whether the range matches this writer.
 */
function validateRange(range) {
  if (!hasExactKeys(range, ["start", "end"]) || !hasExactKeys(range.start, ["line", "column"]) ||
    !hasExactKeys(range.end, ["line", "column"])) return false;
  const { start, end } = range;
  return [start.line, start.column, end.line, end.column].every((value) => Number.isSafeInteger(value) && value >= 1) &&
    (end.line > start.line || (end.line === start.line && end.column > start.column));
}

/**
 * @lang zh-CN 校验一条原生 AST 精确来源并记录它实际引用的源 ID。
 * @lang en Validates one exact native AST source reference and records its actually referenced source ID.
 * @param {unknown} ref 源引用。 / Source reference.
 * @param {Set<string>} sourceIds 已声明的源码 ID。 / Declared source IDs.
 * @param {Set<string>} usedSourceIds 已引用的源码 ID。 / Referenced source IDs.
 * @returns {boolean} 引用是否可信。 / Whether the reference has the expected shape.
 */
function validateSourceRef(ref, sourceIds, usedSourceIds) {
  if (!hasExactKeys(ref, ["sourceId", "range", "rangeConvention", "rangeSource", "rangeSourceDetail", "confidence"]) ||
    !sourceIds.has(ref.sourceId) || !validateRange(ref.range) ||
    !hasExactKeys(ref.rangeConvention, ["endBoundary", "columnUnit"]) ||
    ref.rangeConvention.endBoundary !== "exclusive" || ref.rangeConvention.columnUnit !== "utf16-code-unit" ||
    ref.rangeSource !== "parser" || ref.rangeSourceDetail !== "jsdoc-ast" || ref.confidence !== "high") return false;
  usedSourceIds.add(ref.sourceId);
  return true;
}

/**
 * @lang zh-CN 以 integration 的当前节点顺序验证所有符号项，并拒绝孤立的来源声明。
 * @lang en Validates every symbol entry against current integration node order and rejects orphan source declarations.
 * @param {unknown} entries 映射项。 / Map entries.
 * @param {unknown} nodes 同轮 integration 节点。 / Same-run integration nodes.
 * @param {Set<string>} sourceIds 已声明源码 ID。 / Declared source IDs.
 * @returns {boolean} 条目与引用是否形成完整闭包。 / Whether entries and references form a complete closure.
 */
function validateEntries(entries, nodes, sourceIds) {
  if (!Array.isArray(entries) || !Array.isArray(nodes) || entries.length !== nodes.length) return false;
  const nodeIds = new Set();
  const usedSourceIds = new Set();
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const entry = entries[index];
    if (node === null || typeof node !== "object" || Array.isArray(node) ||
      typeof node.id !== "string" || !node.id || nodeIds.has(node.id) ||
      typeof node.kind !== "string" ||
      !hasExactKeys(entry, ["id", "kind", "symbolId", "symbolKind", "sourceRefs", "artifactRefs", "diagnostics"]) ||
      entry.id !== `entry:${index}` || entry.kind !== "symbol" || entry.symbolId !== node.id ||
      entry.symbolKind !== (node.kind || "unknown") || !Array.isArray(entry.sourceRefs) || entry.sourceRefs.length > 1 ||
      !Array.isArray(entry.artifactRefs) || entry.artifactRefs.length !== 1 ||
      !Array.isArray(entry.diagnostics) || entry.diagnostics.length !== 0) return false;
    nodeIds.add(node.id);
    // <lang><zh-CN>每个符号至多一条已证 AST 引用；没有范围的符号保留空数组，不伪造 unknown。</zh-CN><en>Each symbol has at most one verified AST reference; a symbol without a range retains an empty array instead of a fabricated unknown range.</en></lang>
    if (entry.sourceRefs.length === 1 && !validateSourceRef(entry.sourceRefs[0], sourceIds, usedSourceIds)) return false;
    const artifactRef = entry.artifactRefs[0];
    if (!hasExactKeys(artifactRef, ["artifactId", "selector", "rangeSource", "confidence"]) ||
      artifactRef.artifactId !== "artifact:jsdoc-integration" || artifactRef.selector !== `ir.nodes.${index}` ||
      artifactRef.rangeSource !== "adapter" || artifactRef.confidence !== "high") return false;
  }
  return usedSourceIds.size === sourceIds.size;
}

/**
 * @lang zh-CN 只接受当前 JSDoc 插件 writer 的封闭 doc-source-map@1.1.0 输出，并与同轮 integration 建立逐节点引用闭包。
 * @lang en Accepts only the current JSDoc plugin writer's closed doc-source-map@1.1.0 output and establishes node-by-node closure with same-run integration.
 * @param {unknown} map 从固定 sidecar 读取的 JSON 值。 / JSON value read from the fixed sidecar.
 * @param {unknown} integration 从固定同级工件读取的 JSON 值。 / JSON value read from the fixed sibling artifact.
 * @returns {boolean} 是否允许把地图加入结果清单；不证明磁盘源码位置。 / Whether the map may enter the result inventory; this does not certify on-disk source positions.
 */
export function validateJsdocDocSourceMap(map, integration) {
  try {
    if (!hasExactKeys(map, ["contract", "contractVersion", "id", "producer", "artifacts", "sources", "sourceMaps", "chains", "entries", "privacy", "diagnostics"]) ||
      map.contract !== "doc-source-map" || map.contractVersion !== "1.1.0" || map.id !== "jsdoc-doc-source-map" ||
      !hasExactKeys(map.producer, ["name", "version", "runtime", "profile"]) ||
      map.producer.name !== "@mandolin/jsdoc-plugin-hia-sys" || !VERSION_PATTERN.test(map.producer.version) ||
      map.producer.runtime !== "jsdoc" || map.producer.profile !== "jsdoc" ||
      !validateArtifacts(map.artifacts) || !Array.isArray(map.sourceMaps) || map.sourceMaps.length !== 0 ||
      !Array.isArray(map.chains) || map.chains.length !== 0 ||
      !Array.isArray(map.diagnostics) || map.diagnostics.length !== 0 ||
      !hasExactKeys(map.privacy, ["sourcesContentPolicy", "allowAbsolutePaths", "allowUncPaths", "allowPathTraversal"]) ||
      map.privacy.sourcesContentPolicy !== "none" || map.privacy.allowAbsolutePaths !== false ||
      map.privacy.allowUncPaths !== false || map.privacy.allowPathTraversal !== false ||
      integration === null || typeof integration !== "object" || Array.isArray(integration) ||
      integration.contract !== "hia-jsdoc-integration" || integration.contractVersion !== "0.1.0" ||
      integration.pluginVersion !== map.producer.version || integration.artifactKind !== "hia-integration" ||
      integration.ir?.source !== "jsdoc" || integration.ir?.version !== map.producer.version) return false;
    const sourceIds = validateSources(map.sources);
    if (sourceIds === null) return false;
    return validateEntries(map.entries, integration.ir?.nodes, sourceIds);
  } catch {
    // <lang><zh-CN>清单阶段只返回拒绝态，任何异常对象及路径均不进入公开诊断。</zh-CN><en>Inventory returns only rejection; exceptions and paths never enter public diagnostics.</en></lang>
    return false;
  }
}
