# JSDoc Runner

Runs JSDoc in standalone and HIA integration modes.

`runHiaJsdoc()` writes a generated config file and invokes the real JSDoc CLI from the installed `jsdoc` package.

`runHiaJsdocProject()` wraps the same JSDoc execution in a `documentation-producer-result` contract for HIA project builds.

The runner validates the closed page/source/scheme selections, inventories `documentation-presentation-profile.json` and
`hia-page-map.json`, and leaves page partitioning, source assets, reader behavior and skin implementation to
`@mandolin/jsdoc-theme-hia`.
