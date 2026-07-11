#!/usr/bin/env node

import path from "node:path";
import { parseArgs } from "node:util";

import {
  HIA_JSDOC_RUNNER_VERSION,
  loadHiaJsdocConfig,
  runHiaJsdocProject
} from "./index.mjs";

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

try {
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

  const result = runHiaJsdocProject(request);
  process.stdout.write(`HIA JSDoc ${result.status}: ${result.artifacts.length} artifact(s).\n`);
  process.exitCode = result.status === "success" ? 0 : 1;
} catch (error) {
  process.stderr.write(`HIA JSDoc failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

function createCliRequest(cliValues, inputs) {
  if (inputs.length === 0) {
    throw new TypeError("At least one input or --config is required.");
  }
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
