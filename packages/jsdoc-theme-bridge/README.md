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

## Public API

| Export | Behavior |
| --- | --- |
| `createHiaJsdocThemeBridge` | `options = {}` → new descriptor with package/version/template/enabled and presentation. Nullish defaults use jsdoc-spec; enabled defaults true, skin classic, scheme system, pageMode multi-page and sourceMode fetch. packageName also selects the skin-catalog owner. |
| `getHiaJsdocThemeTemplate` | `options = {}` → descriptor.template. |

The presentation descriptor selects exact documentation-presentation-profile
1.0.0 and an owner catalog projection. It is not a generated complete profile or
a copied CSS/DOM/catalog. Explicit custom package/version/template choices remain
local metadata; runtime validation and matching the actual theme are separate.

**Errors:** helpers do not check template existence, registry availability or all
selection enums. The project runner validates its admitted closed selections and
pairs actual presentation output with the bridge. An identity match is not a
complete semantic profile validator or source publication authorization.

**Side effects:** no filesystem access, installation or rendering. The returned
object is new; its version is metadata, never evidence of an npm release.

中文：桥接只声明模板与中性呈现选择，主题负责真实输出；不执行安装/渲染，不把版本元数据当发行事实。
