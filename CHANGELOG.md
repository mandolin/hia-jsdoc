# Changelog

## Unreleased — Presentation identity pairing

- Theme bridge/spec declare exact presentation profile 1.0.0. The runner reads the generated identity and pairs it with its bridge instead of hard-coding a legacy inventory version.
- Unreadable, unsupported or mismatched identities yield HIA_JSDOC_PRESENTATION_ARTIFACT_INVALID without a presentation inventory entry or private error echo. Other artifacts can remain in a partial result. This is an identity check, not full profile validation; package versions and published archives are unchanged.

## Unreleased

- Add HIA JSDoc config schema, `hia-jsdoc` CLI and project producer result surface.
- Add `@hia-doc/jsdoc-producer` as the thin documentation producer adapter.
- Add standalone and first-party self-doc smoke fixtures using canonical `@lang`.

## 0.0.0

- Initialize HIA JSDoc bootstrap workspace.
- Add W-P9.5 umbrella preset, runner, published JPHS/JTH bridge dependencies, extra plugin registry, fixture generation and license audit.
