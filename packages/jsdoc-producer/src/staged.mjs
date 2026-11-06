import fs from "node:fs";
import path from "node:path";
import { jsdocProducer, jsdocProducerDescriptor } from "./index.mjs";

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

/**
 * Runs JSDoc with an in-workspace staging directory, then copies result artifacts into the caller-controlled output directory.
 *
 * @constant {object}
 * @lang zh-CN 先在 workspaceRoot 内建立临时 staging 目录运行 JSDoc，再复制到调用方控制的 outputDirectory，以同时满足 JSDoc 和通用 producer 的路径边界。
 * @lang en Runs JSDoc in a temporary staging directory inside workspaceRoot, then copies artifacts to the caller-controlled outputDirectory to satisfy both JSDoc and generic producer path boundaries.
 */
export const stagedJsdocProducer = Object.freeze({
  descriptor: stagedJsdocProducerDescriptor,
  /**
   * @lang zh-CN 在已验证工作区暂存同步运行JSDoc，再追加复制非失败产物并清理暂存；不保证目标目录原子镜像。
   * @lang en Runs JSDoc synchronously in verified workspace staging, additively copies nonfailed artifacts and cleans staging; the destination is not an atomic mirror.
   * @param {object} request <lang><zh-CN>显式绝对工作区/输出根及相对输入。</zh-CN><en>Explicit absolute workspace/output roots and relative inputs.</en></lang>
   * @param {object} [context={}] <lang><zh-CN>原样委派给普通生产器的受信上下文。</zh-CN><en>Trusted context passed unchanged to the ordinary producer.</en></lang>
   * @returns {object} <lang><zh-CN>普通生产器结果，复制不改变工件语义或失败状态。</zh-CN><en>The ordinary producer result; copying changes neither artifact semantics nor failure status.</en></lang>
   * @throws {*} <lang><zh-CN>根验证、执行、复制或finally清理的本地错误；不自动脱敏。</zh-CN><en>Local errors from root checks, execution, copying or finally cleanup; not automatically redacted.</en></lang>
   */
  produce(request, context = {}) {
    // <lang><zh-CN>规范化本轮显式根；这些绝对路径仅供本地执行，不是可发布元数据。</zh-CN><en>Normalize explicit invocation roots; these absolute paths are local execution data, not publishable metadata.</en></lang>
    const workspaceRoot = normalizeAbsolutePath(request?.workspaceRoot, "workspaceRoot");
    const outputDirectory = normalizeAbsolutePath(request?.outputDirectory, "outputDirectory");
    // <lang><zh-CN>固定暂存根与进程作用域名称限定清理对象，需通过后续真实路径核验。</zh-CN><en>A fixed staging root and process-scoped name constrain cleanup targets, subject to subsequent physical checks.</en></lang>
    const stagingRoot = path.join(workspaceRoot, ".hia-jsdoc-staging");
    const stagingDirectory = path.join(stagingRoot, `${process.pid}-${createStagingName(outputDirectory)}`);
    // <lang><zh-CN>仅成功验证后允许finally清理；异常路径不得删除未核实目录。</zh-CN><en>Finally cleanup is allowed only after successful verification; failure paths cannot delete unverified directories.</en></lang>
    let stagingBoundaryVerified = false;

    try {
      // <lang><zh-CN>递归清理前先核对工作区与暂存目录的真实路径；联接目录不得把清理带到仓外。</zh-CN><en>Check real workspace and staging paths before recursive cleanup; a junction must not redirect cleanup outside the repository.</en></lang>
      verifyStagingBoundary(workspaceRoot, stagingRoot, stagingDirectory);
      stagingBoundaryVerified = true;
      fs.rmSync(stagingDirectory, { recursive: true, force: true });
      const result = jsdocProducer.produce({
        ...request,
        workspaceRoot,
        outputDirectory: stagingDirectory
      }, context);

      if (fs.existsSync(stagingDirectory)) {
        verifyStagingBoundary(workspaceRoot, stagingRoot, stagingDirectory);
        fs.mkdirSync(outputDirectory, { recursive: true });
        // <lang><zh-CN>外部输出可能保留上一轮地图；先移除固定文件，仅复制本轮产物清单认可的地图。</zh-CN><en>The external output may retain a prior map; remove that fixed file and copy a map only when this result inventories it.</en></lang>
        fs.rmSync(path.join(outputDirectory, "hia-doc-source-map.json"), { force: true });
        const mapAccepted = result.artifacts.some((item) => item.kind === "doc-source-map" && item.path === "hia-doc-source-map.json");
        if (result.status !== "failed") {
          // <lang><zh-CN>生成的运行配置可能含本机路径/插件私有选项，不属于可发布工件；既有目标目录仍按追加复制语义处理。</zh-CN><en>Generated runtime configuration can contain local paths/private plugin options and is not a publishable artifact; existing destinations retain additive copy semantics.</en></lang>
          const runtimeConfigDirectory = path.join(stagingDirectory, ".hia-jsdoc");
          fs.cpSync(stagingDirectory, outputDirectory, {
            recursive: true,
            force: true,
            filter(source) {
              if (source === runtimeConfigDirectory) return false;
              return source !== path.join(stagingDirectory, "hia-doc-source-map.json") || mapAccepted;
            }
          });
        }
      }

      return result;
    } finally {
      if (stagingBoundaryVerified) {
        verifyStagingBoundary(workspaceRoot, stagingRoot, stagingDirectory);
        fs.rmSync(stagingDirectory, { recursive: true, force: true });
        removeEmptyDirectory(stagingRoot);
      }
    }
  }
});

export default stagedJsdocProducer;

function normalizeAbsolutePath(value, label) {
  if (typeof value !== "string" || (!path.posix.isAbsolute(value) && !path.win32.isAbsolute(value))) {
    throw new TypeError(`${label} must be an absolute path.`);
  }
  return path.resolve(value);
}

function createStagingName(outputDirectory) {
  return path.basename(outputDirectory).replace(/[^A-Za-z0-9._-]+/g, "-") || "output";
}

/**
 * @lang zh-CN 证明递归清理目标是当前工作区内预定的直属暂存目录，且既有联接没有改变真实路径。
 * @lang en Proves the recursive cleanup target is the intended direct staging child inside this workspace and no existing junction redirects its real path.
 * @param {string} workspaceRoot 真实工作区候选。 / Candidate workspace root.
 * @param {string} stagingRoot 固定暂存根。 / Fixed staging root.
 * @param {string} stagingDirectory 本轮目标。 / This invocation's target.
 * @returns {void} 安全时无返回值。 / No return when safe.
 * @throws {TypeError} 词法或真实路径越界。 / Lexical or physical path escape.
 */
function verifyStagingBoundary(workspaceRoot, stagingRoot, stagingDirectory) {
  try {
    const relative = path.relative(stagingRoot, stagingDirectory);
    if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
      || path.dirname(relative) !== "." || path.basename(stagingRoot) !== ".hia-jsdoc-staging") {
      throw new TypeError("invalid staging path");
    }
    const realWorkspace = fs.realpathSync(workspaceRoot);
    for (const candidate of [stagingRoot, stagingDirectory]) {
      try {
        if (fs.lstatSync(candidate).isSymbolicLink()) throw new TypeError("staging junction");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    const existing = fs.existsSync(stagingDirectory)
      ? stagingDirectory
      : (fs.existsSync(stagingRoot) ? stagingRoot : workspaceRoot);
    const physical = fs.realpathSync(existing);
    const relativePhysical = path.relative(realWorkspace, physical);
    if (relativePhysical === ".." || relativePhysical.startsWith(`..${path.sep}`) || path.isAbsolute(relativePhysical)) {
      throw new TypeError("staging path escaped workspace");
    }
  } catch {
    throw new TypeError("JSDoc staging directory must remain inside workspaceRoot.");
  }
}

function removeEmptyDirectory(directory) {
  try {
    fs.rmdirSync(directory);
  } catch (error) {
    if (error && typeof error === "object" && error.code !== "ENOENT" && error.code !== "ENOTEMPTY") {
      throw error;
    }
  }
}
