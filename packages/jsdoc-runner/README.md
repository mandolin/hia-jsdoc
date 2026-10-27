# JSDoc Runner

Runs JSDoc in standalone and HIA integration modes.

`runHiaJsdoc()` writes a generated config file and invokes the real JSDoc CLI from the installed `jsdoc` package.

`runHiaJsdocProject()` wraps the same JSDoc execution in a `documentation-producer-result` contract for HIA project builds.

The runner validates the closed page/source/scheme selections, inventories `documentation-presentation-profile.json` and
`hia-page-map.json`, and leaves page partitioning, source assets, reader behavior and skin implementation to
`@mandolin/jsdoc-theme-hia`.

For JavaScript documentation source mapping, set `options.hia.docSourceMap.enabled` to `true` in the project config.
The runner requests the fixed `hia-doc-source-map.json` output next to `hia-integration.json` and adds a
`doc-source-map@1.1.0` producer artifact only when the same-build files pass closed structure, privacy, path and
symbol-reference validation. Invalid, missing or failed-build maps receive a public-safe diagnostic and are removed
from the output directory. With the option omitted or false, a prior map in a reused directory is cleared.

The current theme bridge declares documentation-presentation-profile 1.0.0. Artifact inventory reads the generated contract/version and requires an admitted exact identity paired with that bridge. Unreadable, unsupported or mismatched identities produce HIA_JSDOC_PRESENTATION_ARTIFACT_INVALID without a presentation entry; independent artifacts can remain in a partial producer result. This check does not validate the complete profile or authorize source disclosure. No new runtime dependency on the main monorepo is introduced.
