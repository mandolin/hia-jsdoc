import {runHiaJsdocProject} from '@hia-doc/jsdoc-runner';
/** @lang zh-CN 复用纯模块的同一描述符对象。 @lang en Reuses the same descriptor object from its pure module. */
import {jsdocProducerDescriptor} from './descriptor.mjs';
export {jsdocProducerDescriptor} from './descriptor.mjs';

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
