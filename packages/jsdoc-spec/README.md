# JSDoc Spec

Defines HIA JSDoc usage, configuration and rule drafts.

The current draft records the umbrella config contract, published JPHS/JTH dependency versions, standard plugin paths and supported output modes.

`createHiaJsdocPortalUiLocaleBridge()` exposes the metadata-only Portal adoption descriptor for
`documentation-ui-locale-completeness@0.1.0-draft`. The descriptor delegates message catalogs, runtime behavior, HTML/CSS and report generation to
`@hia-doc/renderer-html`; it contains no translations or target-project identity.
