import {
  HIA_JSDOC_THEME_PACKAGE,
  HIA_JSDOC_THEME_TEMPLATE,
  HIA_JSDOC_THEME_VERSION
} from "@hia-doc/jsdoc-spec";

export function createHiaJsdocThemeBridge(options = {}) {
  return {
    package: options.packageName ?? HIA_JSDOC_THEME_PACKAGE,
    version: options.version ?? HIA_JSDOC_THEME_VERSION,
    template: options.template ?? HIA_JSDOC_THEME_TEMPLATE,
    enabled: options.enabled ?? true
  };
}

export function getHiaJsdocThemeTemplate(options = {}) {
  return createHiaJsdocThemeBridge(options).template;
}
