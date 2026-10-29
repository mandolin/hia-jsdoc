/**
 * @file
 * @lang zh-CN 核必要前端包的源/锁/CI运行声明，实际双Node和归档消费另行验收，不冒称已发布身份变化。
 * @lang en Checks source, lock and CI runtime declarations for required frontend packages; actual dual-Node and archive consumption remain separate, without claiming published identities changed.
 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const os = require("node:os");

// <lang><zh-CN>本测试只读取自身仓库；范围来自已有workspace，不跨仓扫描。</zh-CN><en>Read this repository only, deriving scope from its existing workspace without cross-repository scanning.</en></lang>
const root = path.resolve(__dirname, "..");
const expected = "^22.23.4 || ^24.22.1";
/** @lang zh-CN 读取本仓受信JSON，无写入。 @lang en Reads trusted repository JSON without writes. */
const json = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

/** @lang zh-CN 干净CI须显式检出实际自文档化所需两个相邻owner，精确绑定经验证来源；不能依赖开发机目录或浮动main。 @lang en Clean CI explicitly checks out both sibling owners required by actual self-documentation, pinning verified sources rather than developer folders or floating main branches. */
test("clean CI pins sibling owners and runs inside the primary checkout", () => {
  // <lang><zh-CN>只核本仓明确的工作流形态，不宣称通用YAML或远端提交可用性验证。</zh-CN><en>Check this repository's explicit workflow shape, not general YAML semantics or remote commit availability.</en></lang>
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8").replace(/\r\n/gu, "\n");
  assert.match(workflow, /defaults:\s*\n\s+run:\s*\n\s+working-directory: hia-jsdoc/u);
  assert.match(workflow, /name: Check out repository\s+uses: actions\/checkout@v6\s+with:\s+path: hia-jsdoc/u);
  // <lang><zh-CN>插件从自身模块位置解析JSDoc peer；仅检出源码不能证明4.0.5解析器可见。</zh-CN><en>The plugin resolves its JSDoc peer from its own module location; source checkout alone does not make the 4.0.5 parser visible.</en></lang>
  assert.match(workflow, /working-directory: jsdoc-plugin-hia-sys\s+run: npm ci --registry=https:\/\/registry\.npmjs\.org\//u);
  for (const [name, ref] of [["jsdoc-plugin-hia-sys", "e75e9cef879e4e39b2554957d65edc384d3b5a9d"], ["jsdoc-theme-hia", "50420e1f429e37a8bccdb2da8c40c76f97b77c48"]]) {
    // <lang><zh-CN>每段repository/ref/path必须同属于一次checkout，阻止仅在其它步骤或注释出现期望文本。</zh-CN><en>Repository/ref/path must belong to the same checkout block, not merely appear in another step or comment.</en></lang>
    const block = workflow.split(/\n\s+- name:/u).find((step) => step.includes(`repository: mandolin/${name}\n`));
    assert.ok(block, "Required sibling checkout is missing.");
    assert.match(block, /uses: actions\/checkout@v6/u);
    assert.ok(block.includes(`ref: ${ref}\n`));
    assert.ok(block.split("\n").some((line) => line.trim() === `path: ${name}`));
  }
});

/** @lang zh-CN 源清单与实际锁的根/工作区条目必须一致，不修改包版本。 @lang en Root/workspace source manifests and actual lock entries must agree, without changing package versions. */
test("required frontend manifests and lock entries declare the tested Node range", () => {
  const manifest = json("package.json");
  assert.equal(manifest.engines?.node, expected);
  const lock = json("package-lock.json");
  assert.equal(lock.packages[""]?.engines?.node, expected);
  if (manifest.workspaces?.includes("packages/*")) {
    for (const item of fs.readdirSync(path.join(root, "packages"), {withFileTypes: true})) {
      if (!item.isDirectory()) continue;
      const directory = `packages/${item.name}`;
      assert.equal(json(`${directory}/package.json`).engines?.node, expected);
      assert.equal(lock.packages[directory]?.engines?.node, expected);
    }
  }
});

/** @lang zh-CN CI用两平台两补丁，默认Node24，JSDoc开发版本有声明时精确锁定4.0.5；不扩大公开peer兼容承诺。 @lang en CI uses two platforms/two patches and defaults to Node24; declared JSDoc development versions pin 4.0.5 without expanding public peer compatibility claims. */
test("CI and local tooling select the supported runtime matrix", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
  assert.match(workflow, /runs-on:\s*\$\{\{ matrix\.os \}\}/u);
  assert.match(workflow, /os:\s*\n\s*- ubuntu-latest\s*\n\s*- windows-latest/u);
  assert.match(workflow, /node:\s*\n\s*- 22\.23\.4\s*\n\s*- 24\.22\.1/u);
  assert.match(workflow, /run: npm ci/u);
  assert.match(fs.readFileSync(path.join(root, ".mise.toml"), "utf8"), /^node = "24\.22\.1"\s*$/mu);
  const jsdoc = json("package.json").devDependencies?.jsdoc;
  if (jsdoc !== undefined) assert.equal(jsdoc, "4.0.5");
});

/** @lang zh-CN 下限、其它major与预发布分别验证，不由Node26的新LTS状态扩大本项目承诺。 @lang en Tests floors, other majors and prereleases separately; Node26's LTS status never expands this project's promise automatically. */
test("runtime checks preserve explicit floors and reject unsupported versions", () => {
  const {supportsRuntime} = require("../scripts/check-runtime-policy.cjs");
  for (const value of ["18.20.0", "20.20.2", "22.23.3", "24.22.0", "25.0.0", "26.0.0", "24.22.1-rc.1", null]) assert.equal(supportsRuntime(value), false);
  for (const value of ["22.23.4", "22.24.0", "v24.22.1", "24.23.0"]) assert.equal(supportsRuntime(value), true);
});

/** @lang zh-CN 真实隔离fixture分别打破源/锁/CI/mise与JSDoc约束，检查器必须拒绝且不自动改写。 @lang en Real isolated fixtures independently break source, lock, CI, mise and JSDoc constraints; the checker must reject without rewriting them. */
test("release checker rejects drift in each owned runtime surface", () => {
  const {checkRuntimePolicy} = require("../scripts/check-runtime-policy.cjs");
  // <lang><zh-CN>目录为本测试唯一创建，只存合成清单；不会操作业务仓。</zh-CN><en>This test owns a unique directory holding synthetic manifests only, never business repositories.</en></lang>
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "hia-runtime-policy-"));
  const files = {
    "package.json": JSON.stringify({workspaces: ["packages/*"], engines: {node: expected}, devDependencies: {jsdoc: "4.0.5"}}),
    "packages/example/package.json": JSON.stringify({engines: {node: expected}}),
    "package-lock.json": JSON.stringify({packages: {"": {engines: {node: expected}}, "packages/example": {engines: {node: expected}}}}),
    ".mise.toml": '[tools]\nnode = "24.22.1"\n',
    ".github/workflows/ci.yml": 'runs-on: ${{ matrix.os }}\nos:\n  - ubuntu-latest\n  - windows-latest\nnode:\n  - 22.23.4\n  - 24.22.1\nrun: npm ci\n'
  };
  try {
    for (const [file, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(temporary, file)), {recursive: true});
      fs.writeFileSync(path.join(temporary, file), text);
    }
    assert.equal(checkRuntimePolicy(temporary), 2);
    for (const [file, text] of Object.entries(files)) {
      // <lang><zh-CN>每次只改一份文件且保留错误原文，证明检查不会静默修复输入。</zh-CN><en>Change one file at a time and retain its invalid bytes, proving checks never silently repair inputs.</en></lang>
      const changed = text.replaceAll("22.23.4", "20.20.2").replaceAll("24.22.1", "20.20.2");
      fs.writeFileSync(path.join(temporary, file), changed);
      assert.throws(() => checkRuntimePolicy(temporary));
      assert.equal(fs.readFileSync(path.join(temporary, file), "utf8"), changed);
      fs.writeFileSync(path.join(temporary, file), text);
    }
    const changed = files["package.json"].replace('"jsdoc":"4.0.5"', '"jsdoc":"^4.0.5"');
    fs.writeFileSync(path.join(temporary, "package.json"), changed);
    assert.throws(() => checkRuntimePolicy(temporary));
  } finally {
    // <lang><zh-CN>递归删除前核绝对父目录及本测试前缀，只清理本次创建的目录。</zh-CN><en>Verify the absolute parent and test prefix before recursively deleting only this invocation's directory.</en></lang>
    if (path.dirname(path.resolve(temporary)) !== path.resolve(os.tmpdir()) || !path.basename(temporary).startsWith("hia-runtime-policy-")) throw new Error("Unsafe fixture cleanup path.");
    fs.rmSync(temporary, {recursive: true, force: true});
  }
});
