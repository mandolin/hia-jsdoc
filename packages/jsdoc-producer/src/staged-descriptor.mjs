/** @file @lang zh-CN 暂存描述符纯模块，浅展开继续共享基础描述符的数组。 @lang en Pure staged descriptor retaining shared arrays through shallow spreading of the base descriptor. */
import {jsdocProducerDescriptor} from './descriptor.mjs';

/**
 * Describes the JSDoc adapter that stages output inside its source workspace before publishing it to an orchestration output directory.
 *
 * @constant {object}
 * @lang zh-CN 描述先在 JSDoc 源工作区内完成生成，再将已验证产物复制到编排输出目录的 adapter。
 * @lang en Describes the adapter that builds inside the JSDoc source workspace before copying verified artifacts to an orchestration output directory.
 */
export const stagedJsdocProducerDescriptor = Object.freeze({
  ...jsdocProducerDescriptor,
  /**
   * @lang zh-CN 暂存适配器在宿主中显示的名称。
   * @lang en Name presented by the host for the staged adapter.
   */
  displayName: "HIA JSDoc Staged Adapter"
});
