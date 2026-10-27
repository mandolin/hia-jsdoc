# HIA JSDoc Producer

Documentation producer adapter for HIA JSDoc.

This package exposes a thin `documentation-producer@0.1.0-draft` descriptor and delegates all work to `@hia-doc/jsdoc-runner`.

`@hia-doc/jsdoc-producer/staged` is a companion adapter for multi-repository orchestration. It builds in a temporary directory inside the JSDoc workspace, then copies the resulting artifacts to the caller's output directory. This preserves the runner's workspace path boundary while allowing the HIA CLI to keep all project artifacts under one output root.

The staged adapter clears any prior `hia-doc-source-map.json` in a reused caller output and copies the current sidecar
only when the runner includes it in the producer result. A failed run does not copy staging output.
