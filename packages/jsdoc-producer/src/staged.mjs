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
  produce(request, context = {}) {
    const workspaceRoot = normalizeAbsolutePath(request?.workspaceRoot, "workspaceRoot");
    const outputDirectory = normalizeAbsolutePath(request?.outputDirectory, "outputDirectory");
    const stagingRoot = path.join(workspaceRoot, ".hia-jsdoc-staging");
    const stagingDirectory = path.join(stagingRoot, `${process.pid}-${createStagingName(outputDirectory)}`);

    try {
      fs.rmSync(stagingDirectory, { recursive: true, force: true });
      const result = jsdocProducer.produce({
        ...request,
        workspaceRoot,
        outputDirectory: stagingDirectory
      }, context);

      if (fs.existsSync(stagingDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
        fs.cpSync(stagingDirectory, outputDirectory, { recursive: true, force: true });
      }

      return result;
    } finally {
      fs.rmSync(stagingDirectory, { recursive: true, force: true });
      removeEmptyDirectory(stagingRoot);
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

function removeEmptyDirectory(directory) {
  try {
    fs.rmdirSync(directory);
  } catch (error) {
    if (error && typeof error === "object" && error.code !== "ENOENT" && error.code !== "ENOTEMPTY") {
      throw error;
    }
  }
}
