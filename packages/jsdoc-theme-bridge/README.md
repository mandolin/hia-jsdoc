# JSDoc Theme Bridge

## Supported runtime

Current source supports Node.js `^22.23.4 || ^24.22.1`. Release checks use
Node.js 22.23.4 and 24.22.1 on Windows and Ubuntu; actual package qualification
and npm availability remain separate. The repository default is Node.js 24.22.1.

中文：当前源码运行范围为上述两条已确认版本线，CI/安装验收与实际npm发布分别核对。


Bridges the published HIA JSDoc theme package into the JSDoc umbrella.

The bridge keeps `@mandolin/jsdoc-theme-hia` as a dependency reference and exposes the standard JSDoc template path. It does not migrate or copy JTH source code.

It also declares adoption of `documentation-presentation-profile@1.0.0` without copying theme CSS, DOM structure,
semantic tokens or a skin allowlist. Consumers read the skin catalog from the `@mandolin/jsdoc-theme-hia`-owned
`documentation-presentation-profile.theme.skins` projection.

The current presentation descriptor declares exact documentation-presentation-profile 1.0.0 and must be paired with its theme writer. The project runner records the actual matching artifact identity. This source update does not change package versions or published archives.
