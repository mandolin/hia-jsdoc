/**
 * @file
 * @lang zh-CN HIA JSDoc命令描述、实际解析声明及已确认帮助的采用回归。
 * @lang en Adoption regressions for HIA JSDoc command descriptions, actual parser declarations and confirmed help.
 */
import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  mkdtemp,
  writeFile,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  realpath,
} from "node:fs/promises";
import os from "node:os";
import { columns, formatJsDocHelp } from "../scripts/format-command-help.mjs";
import { createJsDocCommandContent } from "../packages/jsdoc-runner/src/command-content.mjs";
import {
  observeJsDocOptions,
  checkCommandDocumentation,
  buildCommandDocumentation,
} from "../scripts/command-documentation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(root, "packages/jsdoc-runner/src/cli.mjs");

/**
 * @lang zh-CN 为真实JSDoc执行准备独占合成工作区，通过目录链接复用已安装依赖。
 * @lang en Prepare an owned synthetic workspace for actual JSDoc execution, reusing installed dependencies through a directory link.
 * @param {function(string):Promise<void>} action <lang><zh-CN>在独占目录执行的断言。</zh-CN><en>Assertions executed in the owned directory.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>断言完成后仅清理已核临时边界。</zh-CN><en>Clean only the verified temporary boundary after assertions.</en></lang>
 */
async function withWorkspace(action) {
  // <lang><zh-CN>合成源码及配置只存在于本次唯一临时目录，业务仓保持只读。</zh-CN><en>Synthetic source and config exist only in this unique temporary directory, retaining business repository read boundaries.</en></lang>
  const directory = await mkdtemp(path.join(os.tmpdir(), "jsdoc-command-"));
  try {
    await writeFile(
      path.join(directory, "sample.js"),
      "/** @lang zh-CN 问候访问者。\n * @lang en Greet a visitor. */\nfunction greet() {}\n",
    );
    await symlink(
      path.join(root, "node_modules"),
      path.join(directory, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await action(directory);
  } finally {
    // <lang><zh-CN>核真实父目录与固定前缀后删除独占树，Node删除目录链接自身而不遍历其目标。</zh-CN><en>Delete the owned tree only after checking its physical parent and fixed prefix, with Node removing the directory link itself without traversing its target.</en></lang>
    assert.equal(
      path.dirname(await realpath(directory)),
      await realpath(os.tmpdir()),
    );
    assert.ok(path.basename(directory).startsWith("jsdoc-command-"));
    await rm(directory, { recursive: true, force: true });
  }
}

test("a refused core projection preserves the existing generated group", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "jsdoc-command-"));
  const receiptPath = path.join(
    root,
    "packages/jsdoc-runner/src/command-documentation/generation.json",
  );
  const before = await readFile(receiptPath);
  try {
    const module = path.join(directory, "refused-core.mjs");
    await writeFile(
      module,
      'export async function produceCommandDocumentation() { return {status:"refused",diagnostics:[]}; }\n',
    );
    await assert.rejects(buildCommandDocumentation(module));
    assert.deepEqual(await readFile(receiptPath), before);
  } finally {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("jsdoc-command-"));
    await rm(directory, { recursive: true, force: true });
  }
});

test("the descriptor covers seven actual switches and conditional positional inputs", () => {
  const command = createJsDocCommandContent();
  const actual = observeJsDocOptions();
  assert.equal(command.options.length, 7);
  assert.equal(command.positionals[0].name, "positionals");
  assert.equal(command.positionals[0].multiple, true);
  assert.deepEqual(
    command.options.map((item) => item.name).sort(),
    actual.options.map((item) => item.name).sort(),
  );
  assert.equal(actual.strict, true);
  assert.equal(actual.allowPositionals, true);
});

test("the checked generated artifacts bind current sources and original parser declarations", async () => {
  const receipt = await checkCommandDocumentation();
  assert.equal(receipt.commands, 1);
  assert.equal(receipt.symbols, 9);
});

test("an option type conflict is rejected independently of the descriptor", async () => {
  const actual = observeJsDocOptions();
  actual.options.find((option) => option.name === "config").valueType =
    "boolean";
  await assert.rejects(checkCommandDocumentation({ observation: actual }));
});

for (const [args, code, expected] of [
  [["--help"], 0, "HIA-Documentation-Sys · hia-jsdoc"],
  [["-h"], 0, "配置与副作用 / Configuration and effects"],
  [
    ["--help", "--unknown-command-option"],
    1,
    "HIA JSDoc failed: configuration or execution was rejected.",
  ],
  [
    ["--help", "--config"],
    1,
    "HIA JSDoc failed: configuration or execution was rejected.",
  ],
  [["--help", "--mode", "not-a-mode"], 0, "HIA-Documentation-Sys · hia-jsdoc"],
  [
    ["--help", "--config", "missing.json"],
    0,
    "HIA-Documentation-Sys · hia-jsdoc",
  ],
  [["--version"], 0, "1.0.0"],
  [["--help", "--version"], 0, "HIA-Documentation-Sys · hia-jsdoc"],
  [
    ["--version", "--unknown-command-option"],
    1,
    "HIA JSDoc failed: configuration or execution was rejected.",
  ],
  [[], 1, "HIA JSDoc failed: configuration or execution was rejected."],
]) {
  test("normal CLI boundary " + JSON.stringify(args), () => {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, code);
    assert.ok((code ? result.stderr : result.stdout).includes(expected));
    assert.equal(code ? result.stdout : result.stderr, "");
    assert.equal(result.stdout.includes("\x1b"), false);
  });
}

for (const value of ["", "invalid"]) {
  test(
    "help skips business mode and regex validation " + JSON.stringify(value),
    async () =>
      withWorkspace(async (directory) => {
        const before = (await readdir(directory)).sort();
        const result = spawnSync(
          process.execPath,
          [
            cli,
            "--help",
            "--mode",
            value,
            "--include-pattern",
            "[",
            "--config",
            "missing.json",
          ],
          { cwd: directory, encoding: "utf8" },
        );
        assert.equal(result.status, 0);
        assert.equal(result.stderr, "");
        assert.match(result.stdout, /HIA-Documentation-Sys · hia-jsdoc/u);
        assert.deepEqual((await readdir(directory)).sort(), before);
      }),
  );
}

test("direct mode uses last values and executes installed JSDoc with owned outputs", async () =>
  withWorkspace(async (directory) => {
    const result = spawnSync(
      process.execPath,
      [
        cli,
        "--out-dir",
        "first",
        "--out-dir",
        "second",
        "--mode",
        "invalid",
        "--mode",
        "both",
        "sample.js",
      ],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(result.stderr, "");
    assert.equal((await readdir(directory)).includes("first"), false);
    const manifest = JSON.parse(
      await readFile(
        path.join(directory, "second/hia-jsdoc.producer-result.json"),
        "utf8",
      ),
    );
    assert.equal(manifest.status, "success");
    assert.ok(
      manifest.artifacts.some((artifact) => artifact.kind === "jsdoc-html"),
    );
    assert.ok(
      manifest.artifacts.some(
        (artifact) => artifact.kind === "jsdoc-integration",
      ),
    );
  }));

test("config mode ignores direct-only input and applies output, regex and mode overrides", async () =>
  withWorkspace(async (directory) => {
    await writeFile(
      path.join(directory, "config.json"),
      JSON.stringify({
        schemaVersion: "1.0.0",
        outputDirectory: "configured",
        inputs: [{ path: "sample.js" }],
        options: { mode: "standalone" },
      }),
    );
    const result = spawnSync(
      process.execPath,
      [
        cli,
        "--config",
        "config.json",
        "--workspace-root",
        "missing-root",
        "missing-input.js",
        "--out-dir",
        "overridden",
        "--include-pattern",
        ".+\\.js$",
        "--mode",
        "both",
      ],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal((await readdir(directory)).includes("configured"), false);
    const config = JSON.parse(
      await readFile(
        path.join(directory, "overridden/.hia-jsdoc/jsdoc.conf.json"),
        "utf8",
      ),
    );
    assert.equal(config.source.includePattern, ".+\\.js$");
    const manifest = JSON.parse(
      await readFile(
        path.join(directory, "overridden/hia-jsdoc.producer-result.json"),
        "utf8",
      ),
    );
    assert.equal(manifest.status, "success");
    assert.ok(
      manifest.artifacts.some(
        (artifact) => artifact.kind === "jsdoc-integration",
      ),
    );
  }));

test("config empty overrides retain values while direct empty arguments are rejected", async () =>
  withWorkspace(async (directory) => {
    await writeFile(
      path.join(directory, "config.json"),
      JSON.stringify({
        schemaVersion: "1.0.0",
        outputDirectory: "configured",
        inputs: [{ path: "sample.js" }],
        options: { mode: "both", includePattern: ".+\\.js$" },
      }),
    );
    const result = spawnSync(
      process.execPath,
      [
        cli,
        "--config",
        "config.json",
        "--out-dir",
        "",
        "--mode",
        "",
        "--include-pattern",
        "",
      ],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const config = JSON.parse(
      await readFile(
        path.join(directory, "configured/.hia-jsdoc/jsdoc.conf.json"),
        "utf8",
      ),
    );
    assert.equal(config.source.includePattern, ".+\\.js$");
    const before = (await readdir(directory)).sort();
    for (const flag of ["--out-dir", "--mode", "--include-pattern"]) {
      const rejected = spawnSync(
        process.execPath,
        [cli, flag, "", "sample.js"],
        { cwd: directory, encoding: "utf8" },
      );
      assert.equal(rejected.status, 1);
      assert.equal(rejected.stdout, "");
      assert.equal(
        rejected.stderr,
        "HIA JSDoc failed: configuration or execution was rejected.\n",
      );
    }
    assert.deepEqual((await readdir(directory)).sort(), before);
  }));

test("leading separator preserves failed-build stdout and result manifest", async () =>
  withWorkspace(async (directory) => {
    const result = spawnSync(process.execPath, [cli, "--", "--help"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "HIA JSDoc failed: 0 artifact(s).\n");
    assert.equal(result.stderr, "");
    const manifest = JSON.parse(
      await readFile(
        path.join(directory, "dist/hia-jsdoc/hia-jsdoc.producer-result.json"),
        "utf8",
      ),
    );
    assert.equal(manifest.status, "failed");
    assert.equal(manifest.artifacts.length, 0);
  }));

for (const width of [80, 120]) {
  test("actual shared help respects Unicode display canvas " + width, () => {
    const help = formatJsDocHelp(createJsDocCommandContent(), width);
    assert.ok(help.endsWith("\n"));
    assert.equal(help.includes("\x1b"), false);
    for (const line of help.split("\n"))
      assert.ok(columns(line) <= width, line);
  });
}

test("a mismatched actual parser byte digest is rejected", async () => {
  const actual = observeJsDocOptions();
  actual.cliSha256 = "0".repeat(64);
  await assert.rejects(checkCommandDocumentation({ observation: actual }));
});
