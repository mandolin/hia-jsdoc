/**
 * @file
 * @lang zh-CN 分发配置1.0.0及原字节历史schema；新默认不改历史required。
 * @lang en Distributes config 1.0.0 and the byte-preserved historical schema; new defaults never change historical required lists.
 */
import {
  HIA_JSDOC_CONFIG_JSON_SCHEMA as legacySchema,
  HIA_JSDOC_CONFIG_SCHEMA_ID as legacyId,
  HIA_JSDOC_CONFIG_SCHEMA_VERSION as legacyVersion
} from "./schema-legacy.mjs";

/**
 * @lang zh-CN 精确旧配置版本，供历史读取和显式迁移。
 * @lang en Exact legacy config version for historical reading and explicit migration.
 */
export const HIA_JSDOC_LEGACY_CONFIG_SCHEMA_VERSION = legacyVersion;
/**
 * @lang zh-CN 历史schema稳定标识符，不保证网络可达。
 * @lang en Stable historical schema identifier, without a network availability promise.
 */
export const HIA_JSDOC_LEGACY_CONFIG_SCHEMA_ID = legacyId;
/**
 * @lang zh-CN 原schema对象，历史required及字段保持。
 * @lang en Original schema object preserving historical required lists and fields.
 */
export const HIA_JSDOC_LEGACY_CONFIG_JSON_SCHEMA = legacySchema;
/**
 * @lang zh-CN 当前配置写者1.0.0；包版本另行管理。
 * @lang en Current config writer 1.0.0; package versions are managed separately.
 */
export const HIA_JSDOC_CONFIG_SCHEMA_VERSION = "1.0.0";
/**
 * @lang zh-CN 当前schema稳定标识符；安装件另有实际JSON资源。
 * @lang en Stable current schema identifier; installed packages separately provide actual JSON resources.
 */
export const HIA_JSDOC_CONFIG_SCHEMA_ID = "https://mandolin.github.io/HIA-Documentation/schemas/hia-jsdoc-config-1.0.0.schema.json";

// <lang><zh-CN>深复制后只改已确认差异，禁止嵌套引用回写旧schema。</zh-CN><en>Deep-copy before applying confirmed changes so nested references cannot rewrite the old schema.</en></lang>
const currentSchema = structuredClone(legacySchema);
currentSchema.$id = HIA_JSDOC_CONFIG_SCHEMA_ID;
currentSchema.properties.$schema.const = HIA_JSDOC_CONFIG_SCHEMA_ID;
currentSchema.properties.schemaVersion.const = HIA_JSDOC_CONFIG_SCHEMA_VERSION;
currentSchema.required = ["schemaVersion", "inputs"];
// <lang><zh-CN>历史schema复用同一个relativePath节点；结构克隆保留该别名，故字段各自展开，避免默认值互相污染。</zh-CN><en>The historical schema reuses one relativePath node; structural cloning preserves that alias, so spread each field separately to prevent default-value contamination.</en></lang>
currentSchema.properties.workspaceRoot = {...currentSchema.properties.workspaceRoot, default: "."};
currentSchema.properties.outputDirectory = {...currentSchema.properties.outputDirectory, default: "dist/hia-jsdoc"};
currentSchema.properties.inputs.items.required = ["path"];
currentSchema.properties.inputs.items.properties.kind.description = "省略时.mjs为javascript-module，其它路径为javascript-source。 / If omitted, .mjs selects javascript-module; other paths select javascript-source.";

/**
 * @lang zh-CN 当前schema；default注解不会自动填充输入。
 * @lang en Current schema; default annotations do not automatically fill input values.
 */
export const HIA_JSDOC_CONFIG_JSON_SCHEMA = Object.freeze(currentSchema);

/**
 * @lang zh-CN 按精确版本返回schema，不猜测SemVer兼容，不查文件或执行插件。
 * @lang en Returns a schema by exact version without inferring SemVer compatibility, reading files or executing plugins.
 * @param {string} [version="1.0.0"] <lang><zh-CN>当前或精确旧版本。</zh-CN><en>Current or exact legacy version.</en></lang>
 * @returns {object} <lang><zh-CN>所选schema，不修改调用方输入。</zh-CN><en>Selected schema, without changing caller input.</en></lang>
 * @throws {TypeError} <lang><zh-CN>未知版本；固定错误不回显私有值。</zh-CN><en>Unknown version; fixed errors never echo private values.</en></lang>
 */
export function getHiaJsdocConfigSchema(version = HIA_JSDOC_CONFIG_SCHEMA_VERSION) {
  if (version === HIA_JSDOC_CONFIG_SCHEMA_VERSION) return HIA_JSDOC_CONFIG_JSON_SCHEMA;
  if (version === legacyVersion) return legacySchema;
  throw new TypeError("Unsupported HIA JSDoc configuration schema version.");
}
