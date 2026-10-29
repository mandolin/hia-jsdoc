#!/usr/bin/env node

/**
 * @file
 * @lang zh-CN 受信本地JSDoc项目CLI，复用runner准入与固定输出；公开失败不回显参数、路径、JSON片段或子进程原文。
 * @lang en Trusted local JSDoc project CLI reusing runner admission and fixed outputs; public failures omit arguments, paths, JSON excerpts and raw child-process output.
 */
import path from "node:path";
import { parseArgs } from "node:util";

import {
  HIA_JSDOC_RUNNER_VERSION,
  loadHiaJsdocConfig,
  runHiaJsdocProject
} from "./index.mjs";

// <lang><zh-CN>参数解析本身也可能包含私有原值，因此与配置/运行失败进入同一公开安全边界。</zh-CN><en>Argument parsing may itself contain private values, so it shares the public-safe boundary with configuration and execution failures.</en></lang>
try {
  const { values, positionals } = parseArgs({
    options: {
      config: { type: "string", short: "c" },
      help: { type: "boolean", short: "h" },
      "include-pattern": { type: "string" },
      mode: { type: "string" },
      "out-dir": { type: "string", short: "o" },
      version: { type: "boolean", short: "v" },
      "workspace-root": { type: "string" }
    },
    allowPositionals: true,
    strict: true
  });

  if (values.help) {
    process.stdout.write(`HIA JSDoc ${HIA_JSDOC_RUNNER_VERSION}\n\nUsage:\n  hia-jsdoc --config hia-jsdoc.config.json\n  hia-jsdoc [options] <input...>\n\nOptions:\n  -c, --config <path>\n  -o, --out-dir <path>\n      --workspace-root <path>\n      --include-pattern <regex>\n      --mode <standalone|hiaIntegration|both>\n  -v, --version\n`);
    process.exit(0);
  }

  if (values.version) {
    process.stdout.write(`${HIA_JSDOC_RUNNER_VERSION}\n`);
    process.exit(0);
  }

  // <lang><zh-CN>配置读取不执行项目代码；CLI覆盖在runner写前校验前应用，不能绕过最终输出检查。</zh-CN><en>Config loading does not execute project code; apply CLI overrides before the runner's pre-write validation so effective output checks remain mandatory.</en></lang>
  const request = values.config
    ? loadHiaJsdocConfig(values.config)
    : createCliRequest(values, positionals);

  if (values["out-dir"]) {
    request.outputDirectory = path.resolve(request.workspaceRoot, values["out-dir"]);
  }
  if (values["include-pattern"]) {
    request.options.includePattern = values["include-pattern"];
  }
  if (values.mode) {
    request.options.mode = values.mode;
  }

  // <lang><zh-CN>只公开状态和工件数量，低层原始进程输出不会作为终端失败正文。</zh-CN><en>Expose only status and artifact count; raw low-level process output never becomes terminal failure text.</en></lang>
  const result = runHiaJsdocProject(request);
  process.stdout.write(`HIA JSDoc ${result.status}: ${result.artifacts.length} artifact(s).\n`);
  process.exitCode = result.status === "success" ? 0 : 1;
} catch {
  process.stderr.write("HIA JSDoc failed: configuration or execution was rejected.\n");
  process.exitCode = 1;
}

/**
 * @lang zh-CN 将受信CLI参数转为项目请求，目录和输入仍交runner校验；不创建输出。
 * @lang en Converts trusted CLI arguments into a project request while leaving directory/input validation to the runner; creates no output.
 * @param {object} cliValues <lang><zh-CN>parseArgs产生的选项。</zh-CN><en>Options produced by parseArgs.</en></lang>
 * @param {string[]} inputs <lang><zh-CN>相对工作区的显式输入。</zh-CN><en>Explicit workspace-relative inputs.</en></lang>
 * @returns {object} <lang><zh-CN>待准入的运行请求。</zh-CN><en>Execution request awaiting admission.</en></lang>
 * @throws {TypeError} <lang><zh-CN>缺少显式输入。</zh-CN><en>No explicit inputs were supplied.</en></lang>
 */
function createCliRequest(cliValues, inputs) {
  if (inputs.length === 0) {
    throw new TypeError("At least one input or --config is required.");
  }
  // <lang><zh-CN>工作区只作为本地运行基准，不序列化进公开结果。</zh-CN><en>The workspace is a local execution base, never serialized into public results.</en></lang>
  const workspaceRoot = path.resolve(process.cwd(), cliValues["workspace-root"] ?? ".");
  return {
    workspaceRoot,
    outputDirectory: path.resolve(workspaceRoot, cliValues["out-dir"] ?? "dist/hia-jsdoc"),
    inputs: inputs.map((inputPath) => ({
      kind: "javascript-source",
      path: inputPath
    })),
    options: {
      mode: cliValues.mode ?? "both",
      includePattern: cliValues["include-pattern"] ?? ".+\\.(mjs|cjs|js|jsx)$",
      writeResultManifest: true
    }
  };
}
