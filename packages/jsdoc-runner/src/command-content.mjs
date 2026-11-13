/**
 * @file
 * @lang zh-CN JSDoc命令的纯双语内容，供静态帮助及开发期core投影共同使用。
 * @lang en Pure bilingual JSDoc command content shared by static help and development-time core projection.
 */
import { HIA_JSDOC_RUNNER_VERSION } from "./metadata.mjs";

/** @lang zh-CN 创建独立的原生字段语言模型，键名及两语正文精确保留。
 * @lang en Create an independent native field locale model retaining exact keys and both localized texts.
 * @param {object} fields <lang><zh-CN>中文/英文文本对。</zh-CN><en>Chinese/English text pairs.</en></lang>
 * @returns {object} <lang><zh-CN>1.0.0字段语言模型。</zh-CN><en>A 1.0.0 field locale model.</en></lang>
 */
function localized(fields) {
  return {
    enabled: true,
    model: "hia-text-i18n",
    modelVersion: "1.0.0",
    defaultLocale: "zh-CN",
    locales: ["zh-CN", "en"],
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [
        key,
        {
          fieldPath: key,
          kind: "text",
          defaultLocale: "zh-CN",
          localizedText: { "zh-CN": value[0], en: value[1] },
        },
      ]),
    ),
  };
}

/** @lang zh-CN 构造参数内容；其名称/类型/短名另由真实parseArgs调用观察。
 * @lang en Construct parameter content, with names, types and short names independently observed from the actual parseArgs call.
 * @param {string} name <lang><zh-CN>原生参数名。</zh-CN><en>Native parameter name.</en></lang>
 * @param {string} zh <lang><zh-CN>中文说明。</zh-CN><en>Chinese description.</en></lang>
 * @param {string} en <lang><zh-CN>英文说明。</zh-CN><en>English description.</en></lang>
 * @param {object} settings <lang><zh-CN>原生类型、短名、显示槽及默认规则。</zh-CN><en>Native type, short name, display slot and default rule.</en></lang>
 * @returns {object} <lang><zh-CN>带未绑定来源的参数内容。</zh-CN><en>Parameter content awaiting provenance binding.</en></lang>
 */
function parameter(name, zh, en, settings = {}) {
  // <lang><zh-CN>显示槽属于文案，位置参数名保留Node原生positionals身份。</zh-CN><en>The displayed slot is prose, while positional names retain Node's native positionals identity.</en></lang>
  const fields = { summary: [zh, en], description: [zh, en] };
  if (settings.metavar) fields.metavar = [settings.metavar, settings.metavar];
  return {
    id: name,
    kind: settings.kind ?? "option",
    name,
    ...(settings.short ? { short: settings.short } : {}),
    valueType: settings.valueType ?? "string",
    required: false,
    multiple: settings.multiple ?? false,
    ...(settings.choices ? { choices: settings.choices } : {}),
    defaultRule: settings.defaultRule ?? {
      kind: "conditional",
      conditions: ["description"],
    },
    i18n: localized(fields),
    evidence: [],
  };
}

/**
 * @lang zh-CN 返回hia-jsdoc的独立双语内容图，供帮助及core开发期投影使用。
 * @lang en Return an independent bilingual hia-jsdoc content graph shared by help and development-time core projection.
 * @returns {object} <lang><zh-CN>待真实来源与解析观察绑定的命令声明，无IO副作用。</zh-CN><en>Command declaration awaiting actual-source and parser-observation binding, without IO effects.</en></lang>
 */
export function createJsDocCommandContent() {
  return {
    id: "hia-jsdoc",
    executable: "hia-jsdoc",
    path: [],
    kind: "command",
    signature: "hia-jsdoc [options] <input...>",
    i18n: localized({
      summary: [
        "构建JSDoc与HIA集成文档",
        "Build JSDoc and HIA integration documentation",
      ],
      description: [
        "从配置或直接输入建立请求并运行真实JSDoc，加载所选受信插件与模板。",
        "Build a request from configuration or direct inputs and run actual JSDoc with selected trusted plugins and templates.",
      ],
      configUsage: [
        "hia-jsdoc --config hia-jsdoc.config.json",
        "hia-jsdoc --config hia-jsdoc.config.json",
      ],
      configOverrides: [
        "配置模式非空out-dir、include-pattern与mode覆盖原值，空字符串保留配置。",
        "In config mode nonempty out-dir, include-pattern and mode values override configuration; empty strings retain it.",
      ],
      directOnly: [
        "workspace-root和位置输入仅用于直接模式；配置模式忽略它们。",
        "workspace-root and positional inputs apply to direct mode only; config mode ignores them.",
      ],
      paths: [
        "配置路径相对调用目录，配置工作区相对配置目录；直接工作区相对调用目录，输出相对工作区。",
        "Config paths use cwd and configured workspaces use the config directory; direct workspaces use cwd and output uses the workspace.",
      ],
      writes: [
        "运行真实JSDoc并写运行配置及工件，失败时可能已写文件，旧产物可能保留。所选插件与模板执行本地代码，其网络能力需单独授权。",
        "Run actual JSDoc and write runtime config and artifacts; failure may leave files and prior artifacts may remain. Selected plugins and templates execute local code, with network capabilities requiring separate authorization.",
      ],
      parsing: [
        "Node严格解析先于帮助，未知开关或缺值返回1；重复带值选项取最后值，--后作为位置输入。",
        "Node strict parsing precedes help; unknown switches or missing values exit 1. Repeated value options use the last value, and tokens after -- are positional inputs.",
      ],
      prerequisites: [
        "默认插件和主题从工作区node_modules读取，须预先安装匹配包；模式控制HIA集成与主题，上游默认模板仍可能写HTML。",
        "Default plugins and themes resolve from workspace node_modules and require matching installed packages. Mode selects HIA integration and theme behavior; the upstream default template may still write HTML.",
      ],
      offline: [
        "@hia-doc/jsdoc-runner/README.md",
        "@hia-doc/jsdoc-runner/README.md",
      ],
    }),
    displayVersion: { kind: "runner", value: HIA_JSDOC_RUNNER_VERSION },
    parsing: {
      helpOrder: "after-argument-validation",
      unknownOptions: "reject",
    },
    options: [
      parameter(
        "config",
        "从JSON配置构造请求。",
        "Build a request from JSON configuration.",
        {
          short: "c",
          metavar: "path",
          defaultRule: { kind: "not-applicable" },
        },
      ),
      parameter(
        "out-dir",
        "输出相对工作区，直接模式缺省dist/hia-jsdoc；空字符串选工作区根并受输出边界检查。",
        "Output is workspace-relative and defaults to dist/hia-jsdoc in direct mode; an empty string selects the workspace root, subject to output-boundary checks.",
        { short: "o", metavar: "path" },
      ),
      parameter(
        "workspace-root",
        "直接模式相对调用目录，省略为当前目录；配置模式忽略。",
        "Direct mode resolves from cwd and defaults to cwd; ignored in config mode.",
        { metavar: "path" },
      ),
      parameter(
        "include-pattern",
        "直接模式默认匹配mjs/cjs/js/jsx；配置模式仅非空值覆盖，正则由JSDoc解释。",
        "Direct mode defaults to matching mjs/cjs/js/jsx; only nonempty values override config mode, and JSDoc interprets the regex.",
        { metavar: "regex" },
      ),
      parameter(
        "mode",
        "standalone、hiaIntegration或both，直接模式缺省both；配置模式非空值覆盖。",
        "standalone, hiaIntegration or both; direct mode defaults to both and config mode accepts nonempty overrides.",
        {
          metavar: "standalone|hiaIntegration|both",
          choices: ["standalone", "hiaIntegration", "both"],
        },
      ),
      parameter("help", "输出帮助并退出0。", "Print help and exit 0.", {
        short: "h",
        valueType: "boolean",
        defaultRule: { kind: "not-applicable" },
      }),
      parameter(
        "version",
        "输出运行器版本并退出0。",
        "Print runner version and exit 0.",
        {
          short: "v",
          valueType: "boolean",
          defaultRule: { kind: "not-applicable" },
        },
      ),
    ],
    positionals: [
      parameter(
        "positionals",
        "直接模式至少一个工作区相对输入；配置模式忽略。",
        "Direct mode requires at least one workspace-relative input; ignored in config mode.",
        {
          kind: "positional",
          metavar: "input...",
          multiple: true,
          defaultRule: { kind: "not-applicable" },
        },
      ),
    ],
    examples: ["hia-jsdoc --config hia-jsdoc.config.json"],
    effects: { filesystem: "read-write", network: "explicit" },
    exitCodes: [
      {
        code: 0,
        i18n: localized({
          summary: ["成功、帮助或版本", "Success, help or version"],
          description: ["成功、帮助或版本", "Success, help or version"],
        }),
      },
      {
        code: 1,
        i18n: localized({
          summary: [
            "参数、配置或构建失败",
            "Argument, configuration or build failure",
          ],
          description: [
            "参数/配置错误或partial/failed构建",
            "Argument/configuration errors or partial/failed builds",
          ],
        }),
      },
    ],
    evidence: [],
  };
}
