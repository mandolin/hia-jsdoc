import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { createHiaJsdocConfig } from "@hia-doc/jsdoc-preset";

const require = createRequire(import.meta.url);

export function writeHiaJsdocConfig(filePath, options = {}) {
  const config = createHiaJsdocConfig(options);
  const absolutePath = path.resolve(options.cwd ?? process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return {
    path: absolutePath,
    config
  };
}

export function runHiaJsdoc(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const configPath = options.configPath ?? "hia-jsdoc.conf.json";
  const written = writeHiaJsdocConfig(configPath, { ...options, cwd });
  const jsdocBin = require.resolve("jsdoc/jsdoc.js");
  const result = spawnSync(process.execPath, [jsdocBin, "-c", written.path], {
    cwd,
    encoding: "utf8",
    shell: false
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    configPath: written.path,
    config: written.config
  };
}
