import {
  HIA_JSDOC_INPUT_KINDS,
  HIA_JSDOC_OUTPUT_KINDS,
  HIA_JSDOC_RUNNER_VERSION,
  runHiaJsdocProject
} from "@hia-doc/jsdoc-runner";

export const jsdocProducerDescriptor = Object.freeze({
  contract: "documentation-producer",
  contractVersion: "0.1.0-draft",
  id: "jsdoc",
  version: HIA_JSDOC_RUNNER_VERSION,
  displayName: "HIA JSDoc",
  inputKinds: [...HIA_JSDOC_INPUT_KINDS],
  outputKinds: [...HIA_JSDOC_OUTPUT_KINDS],
  capabilities: {
    sourceLinkage: true,
    incremental: false,
    watch: false
  }
});

export const jsdocProducer = Object.freeze({
  descriptor: jsdocProducerDescriptor,
  produce(request, context = {}) {
    return runHiaJsdocProject(request, context);
  }
});

export default jsdocProducer;
