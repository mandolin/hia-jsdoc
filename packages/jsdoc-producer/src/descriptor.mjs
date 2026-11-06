/** @file @lang zh-CN 生产器描述符的纯数据定义，执行函数由原入口提供。 @lang en Pure producer descriptor definitions with execution functions supplied by the original entry. */
import {HIA_JSDOC_RUNNER_VERSION, HIA_JSDOC_INPUT_KINDS, HIA_JSDOC_OUTPUT_KINDS} from '@hia-doc/jsdoc-runner/metadata';

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
