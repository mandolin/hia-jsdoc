# JSDoc Theme Bridge

Bridges the published HIA JSDoc theme package into the JSDoc umbrella.

The bridge keeps `@mandolin/jsdoc-theme-hia` as a dependency reference and exposes the standard JSDoc template path. It does not migrate or copy JTH source code.

It also declares adoption of `documentation-presentation-profile@0.1.0-draft` without copying theme CSS, DOM structure,
semantic tokens or a skin allowlist. Consumers read the skin catalog from the JTH-owned
`documentation-presentation-profile.theme.skins` projection.
