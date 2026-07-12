import { normalizeExtraPluginRegistry } from "@hia-doc/jsdoc-extra-plugin-registry";
import { getHiaJsdocPluginPath } from "@hia-doc/jsdoc-plugin-hia-bridge";
import {
  HIA_JSDOC_UMBRELLA_CONTRACT,
  HIA_JSDOC_UMBRELLA_CONTRACT_VERSION,
  createHiaJsdocVersionSummary,
  normalizeHiaJsdocMode
} from "@hia-doc/jsdoc-spec";
import { getHiaJsdocThemeTemplate } from "@hia-doc/jsdoc-theme-bridge";

/**
 * Creates a JSDoc configuration that wires the HIA plugin, HIA theme, integration output, and extra plugins.
 *
 * @param {object} [options] <lang><zh-CN>HIA JSDoc preset 配置覆盖项。</zh-CN><en>Configuration overrides for the HIA JSDoc preset.</en></lang>
 * @returns {object} <lang><zh-CN>可直接写入 JSDoc config file 的配置对象。</zh-CN><en>A configuration object that can be written directly to a JSDoc config file.</en></lang>
 * @throws {TypeError} <lang><zh-CN>当 mode 不是已支持的 HIA JSDoc 模式时抛出。</zh-CN><en>Thrown when mode is not a supported HIA JSDoc mode.</en></lang>
 * @lang zh-CN 创建串接 HIA 插件、HIA 主题、integration 输出和额外插件的 JSDoc 配置。
 * @lang en Creates a JSDoc configuration that wires the HIA plugin, HIA theme, integration output, and extra plugins.
 */
export function createHiaJsdocConfig(options = {}) {
  const mode = normalizeHiaJsdocMode(options.mode ?? "both");
  const destination = options.destination ?? "docs/api";
  const integrationOutputFile = options.integrationOutputFile ?? `${destination.replaceAll("\\", "/").replace(/\/$/, "")}/hia-integration.json`;
  const extraPlugins = normalizeExtraPluginRegistry(options.extraPlugins ?? {});
  const themeEnabled = options.theme?.enabled ?? mode !== "hiaIntegration";
  const integrationEnabled = options.integration?.enabled ?? mode !== "standalone";

  const config = {
    plugins: [
      ...extraPlugins.before.map((plugin) => plugin.module),
      getHiaJsdocPluginPath(options.plugin),
      ...extraPlugins.after.map((plugin) => plugin.module)
    ],
    source: {
      include: options.source?.include ?? ["src"],
      includePattern: options.source?.includePattern ?? ".+\\.js(doc|x)?$",
      excludePattern: options.source?.excludePattern ?? "(^|[/\\\\])_"
    },
    opts: {
      destination,
      recurse: options.recurse ?? true,
      hia: {
        mode: mode === "both" ? "standalone" : mode,
        source: {
          basePath: options.hia?.source?.basePath ?? ".",
          mode: options.hia?.source?.mode ?? "all",
          link: {
            enabled: options.hia?.source?.link?.enabled ?? true,
            rootUrl: options.hia?.source?.link?.rootUrl ?? "",
            openMode: options.hia?.source?.link?.openMode ?? "same-tab"
          },
          preview: {
            enabled: options.hia?.source?.preview?.enabled ?? true,
            defaultExpanded: options.hia?.source?.preview?.defaultExpanded ?? false
          },
          references: {
            enabled: options.hia?.source?.references?.enabled ?? true,
            defaultExpanded: options.hia?.source?.references?.defaultExpanded ?? false
          }
        },
        i18n: {
          enabled: options.hia?.i18n?.enabled ?? false,
          defaultLocale: options.hia?.i18n?.defaultLocale ?? "en",
          fallbackLocale: options.hia?.i18n?.fallbackLocale ?? "en",
          locales: options.hia?.i18n?.locales ?? ["en"],
          mode: options.hia?.i18n?.mode ?? "runtimeSwitch",
          resources: options.hia?.i18n?.resources ?? []
        },
        theme: {
          skin: options.hia?.theme?.skin ?? "classic",
          collapse: {
            docletsDefaultExpanded: options.hia?.theme?.collapse?.docletsDefaultExpanded ?? true,
            sectionsDefaultExpanded: options.hia?.theme?.collapse?.sectionsDefaultExpanded ?? true,
            metadataDefaultExpanded: options.hia?.theme?.collapse?.metadataDefaultExpanded ?? true
          },
          languageControls: {
            mode: options.hia?.theme?.languageControls?.mode ?? "auto",
            dropdownThreshold: options.hia?.theme?.languageControls?.dropdownThreshold ?? 4
          },
          code: {
            controls: options.hia?.theme?.code?.controls ?? true,
            fontFamily: options.hia?.theme?.code?.fontFamily ?? "sarasa",
            fontSize: options.hia?.theme?.code?.fontSize ?? 12,
            lineHeight: options.hia?.theme?.code?.lineHeight ?? 1.55,
            tabSize: options.hia?.theme?.code?.tabSize ?? 2,
            wrap: options.hia?.theme?.code?.wrap ?? false
          }
        },
        integration: {
          enabled: integrationEnabled,
          outputFile: integrationOutputFile
        },
        umbrella: {
          contract: HIA_JSDOC_UMBRELLA_CONTRACT,
          contractVersion: HIA_JSDOC_UMBRELLA_CONTRACT_VERSION,
          versions: createHiaJsdocVersionSummary(),
          extraPluginDiagnostics: extraPlugins.diagnostics
        }
      }
    }
  };

  if (themeEnabled) {
    config.opts.template = getHiaJsdocThemeTemplate(options.theme);
  }

  return mergeJsdocConfig(config, options.baseConfig ?? {});
}

/**
 * Merges a generated HIA JSDoc preset with a user-supplied JSDoc config.
 *
 * @param {object} preset <lang><zh-CN>由 HIA preset 生成的基础配置。</zh-CN><en>The base configuration generated by the HIA preset.</en></lang>
 * @param {object} [userConfig] <lang><zh-CN>使用者提供的 JSDoc 配置覆盖项。</zh-CN><en>User-supplied JSDoc configuration overrides.</en></lang>
 * @returns {object} <lang><zh-CN>合并后的 JSDoc 配置；插件数组会去重，HIA 子配置会逐层合并。</zh-CN><en>The merged JSDoc config; plugin arrays are deduplicated and HIA sub-config is merged by section.</en></lang>
 * @lang zh-CN 将生成的 HIA JSDoc preset 与使用者提供的 JSDoc 配置合并。
 * @lang en Merges a generated HIA JSDoc preset with a user-supplied JSDoc config.
 */
export function mergeJsdocConfig(preset, userConfig = {}) {
  return {
    ...preset,
    ...userConfig,
    plugins: mergeUniqueArrays(preset.plugins ?? [], userConfig.plugins ?? []),
    source: {
      ...(preset.source ?? {}),
      ...(userConfig.source ?? {})
    },
    opts: {
      ...(preset.opts ?? {}),
      ...(userConfig.opts ?? {}),
      hia: {
        ...(preset.opts?.hia ?? {}),
        ...(userConfig.opts?.hia ?? {}),
        source: {
          ...(preset.opts?.hia?.source ?? {}),
          ...(userConfig.opts?.hia?.source ?? {})
        },
        i18n: {
          ...(preset.opts?.hia?.i18n ?? {}),
          ...(userConfig.opts?.hia?.i18n ?? {})
        },
        theme: {
          ...(preset.opts?.hia?.theme ?? {}),
          ...(userConfig.opts?.hia?.theme ?? {})
        },
        integration: {
          ...(preset.opts?.hia?.integration ?? {}),
          ...(userConfig.opts?.hia?.integration ?? {})
        },
        umbrella: {
          ...(preset.opts?.hia?.umbrella ?? {}),
          ...(userConfig.opts?.hia?.umbrella ?? {})
        }
      }
    }
  };
}

function mergeUniqueArrays(left, right) {
  return [...new Set([...left, ...right])];
}
