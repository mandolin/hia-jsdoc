import { HIA_JSDOC_UMBRELLA_CONTRACT_VERSION } from "@hia-doc/jsdoc-spec";

export function createJsdocDocSourceMapRef(options = {}) {
  return {
    kind: "hia-doc-source-map-ref",
    profile: "jsdoc",
    profileVersion: HIA_JSDOC_UMBRELLA_CONTRACT_VERSION,
    href: options.href ?? null,
    sourcesContentPolicy: options.sourcesContentPolicy ?? "none"
  };
}
