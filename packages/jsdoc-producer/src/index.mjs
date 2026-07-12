import {
  HIA_JSDOC_INPUT_KINDS,
  HIA_JSDOC_OUTPUT_KINDS,
  HIA_JSDOC_RUNNER_VERSION,
  runHiaJsdocProject
} from "@hia-doc/jsdoc-runner";

/**
 * Describes the HIA JSDoc documentation producer for orchestration layers.
 *
 * @constant {object}
 * @lang zh-CN 描述供 HIA 编排层发现和选择的 JSDoc documentation producer 能力。
 * @lang en Describes the HIA JSDoc documentation producer for orchestration layers.
 */
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

/**
 * Runs the HIA JSDoc producer implementation behind the generic documentation producer contract.
 *
 * @constant {object}
 * @lang zh-CN 在通用 documentation producer contract 后封装 HIA JSDoc 的执行实现。
 * @lang en Runs the HIA JSDoc producer implementation behind the generic documentation producer contract.
 */
export const jsdocProducer = Object.freeze({
  descriptor: jsdocProducerDescriptor,
  produce(request, context = {}) {
    return runHiaJsdocProject(request, context);
  }
});

export default jsdocProducer;
