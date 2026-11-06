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
 * @lang zh-CN 描述供编排层发现的JSDoc能力，采用已确认SDK1.0.0协议；包版本与其它工件身份独立。
 * @lang en Describes JSDoc capabilities for orchestration using the confirmed SDK 1.0.0 protocol; package versions and other artifact identities remain independent.
 */
export const jsdocProducerDescriptor = Object.freeze({
  /**
   * @lang zh-CN 生产器协议身份，用于宿主发现和校验。
   * @lang en Producer contract identity used for host discovery and validation.
   */
  contract: "documentation-producer",
  /**
   * @lang zh-CN 生产器协议版本，用于主SDK精确匹配。
   * @lang en Producer contract version used for exact matching by the main SDK.
   */
  contractVersion: "1.0.0",
  /**
   * @lang zh-CN 当前文档生产器的稳定领域标识。
   * @lang en Stable domain identifier of this documentation producer.
   */
  id: "jsdoc",
  /**
   * @lang zh-CN 生产器实现版本，取自当前运行器。
   * @lang en Producer implementation version supplied by the current runner.
   */
  version: HIA_JSDOC_RUNNER_VERSION,
  /**
   * @lang zh-CN 供宿主显示的生产器名称。
   * @lang en Producer name presented by the host.
   */
  displayName: "HIA JSDoc",
  /**
   * @lang zh-CN 当前运行器接受的显式输入种类。
   * @lang en Explicit input kinds accepted by the current runner.
   */
  inputKinds: [...HIA_JSDOC_INPUT_KINDS],
  /**
   * @lang zh-CN 当前运行器声明的输出工件种类。
   * @lang en Output artifact kinds declared by the current runner.
   */
  outputKinds: [...HIA_JSDOC_OUTPUT_KINDS],
  /**
   * @lang zh-CN 供主SDK校验的来源关联、增量和监视能力声明。
   * @lang en Source-linkage, incremental and watch capability declarations validated by the main SDK.
   */
  capabilities: {
    /**
     * @lang zh-CN 声明支持来源关联，具体定位精度由实际产物描述。
     * @lang en Declares source-linkage support with precision described by the actual artifacts.
     */
    sourceLinkage: true,
    /**
     * @lang zh-CN 取false，每次执行处理完整请求的输入集。
     * @lang en False selects full processing of the requested input set on each invocation.
     */
    incremental: false,
    /**
     * @lang zh-CN 取false，每次构建由宿主的独立请求触发。
     * @lang en False selects individual host-triggered build requests.
     */
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
  /**
   * @lang zh-CN 同步委派给JSDoc运行器，按请求写输出；描述符不授予额外源码或执行权限。
   * @lang en Delegates synchronously to the JSDoc runner and writes requested output; the descriptor grants no additional source or execution rights.
   * @param {object} request <lang><zh-CN>工作区内的显式输入、输出及选项。</zh-CN><en>Explicit workspace inputs, output and options.</en></lang>
   * @param {object} [context={}] <lang><zh-CN>受信中止/进度上下文，默认空对象。</zh-CN><en>Trusted abort/progress context, defaulting to an empty object.</en></lang>
   * @returns {object} <lang><zh-CN>运行器原结果，包含失败或部分成功状态。</zh-CN><en>The unchanged runner result, including failed or partial status.</en></lang>
   * @throws {*} <lang><zh-CN>输入边界或受信回调抛出的本地错误；调用方负责公开投影。</zh-CN><en>Local errors from input boundaries or trusted callbacks; callers own public projection.</en></lang>
   */
  produce(request, context = {}) {
    return runHiaJsdocProject(request, context);
  }
});

export default jsdocProducer;
