/**
 * @file
 * @lang zh-CN 从精确相邻Git提交准备本仓开发tarball；不安装/发布、不改来源表或相邻工作树，正常CLI必须有预先锁定摘要。
 * @lang en Prepares this repository's development tarballs from exact sibling Git commits without installing/publishing or modifying source tables/sibling worktrees; normal CLI requires prelocked digests.
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {execFileSync} = require("node:child_process");

/**
 * @lang zh-CN 固定错误不反射本地路径/子进程原文；所有命令按数组、无shell执行。
 * @lang en Uses fixed errors without local paths/raw subprocess text; commands use argument arrays without a shell.
 * @param {string} command 固定工具。 / Fixed tool.
 * @param {string[]} args 已核参数。 / Admitted arguments.
 * @param {object} [options={}] 本地cwd/input等。 / Local cwd/input settings.
 * @returns {Buffer} 命令stdout。 / Command stdout.
 * @throws {Error} 固定命令失败。 / Fixed command failure.
 */
function run(command, args, options = {}) {
  try { return execFileSync(command, args, {stdio: ["pipe", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024, ...options}); }
  catch { throw new Error("Pinned owner preparation command failed."); }
}

/**
 * @lang zh-CN 读取受信仓库自己的开发来源声明；公开包依赖不在此改写。
 * @lang en Reads a trusted repository's own development-source declarations without rewriting public package dependencies.
 * @param {string} root 本仓绝对根。 / Absolute repository root.
 * @returns {object[]} 已核来源行。 / Admitted source rows.
 * @throws {Error} 声明或开发依赖不一致。 / Declaration/development-dependency mismatch.
 */
function readSources(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const sources = JSON.parse(fs.readFileSync(path.join(root, "owner-sources.json"), "utf8"));
  if (!Array.isArray(sources.owners) || !sources.owners.length) throw new Error("Pinned owner declarations are required.");
  const names = new Set();
  for (const owner of sources.owners) {
    // <lang><zh-CN>只允许固定GitHub owner的规范名称/精确提交，不把配置当shell或任意路径。</zh-CN><en>Accept canonical names/exact commits for the fixed GitHub owner, never interpreting config as shell or arbitrary paths.</en></lang>
    if (!owner || !/^@mandolin\/[a-z0-9-]+$/u.test(owner.name) || !/^[a-z0-9-]+$/u.test(owner.repository)
      || owner.name !== `@mandolin/${owner.repository}` || !/^[a-f0-9]{40}$/u.test(owner.commit)
      || owner.version !== "1.0.0" || owner.archive !== `mandolin-${owner.repository}-1.0.0.tgz`
      || names.has(owner.name) || manifest.devDependencies?.[owner.name] !== `file:.owner-packages/${owner.archive}`) {
      throw new Error("Pinned owner declaration or development dependency is invalid.");
    }
    names.add(owner.name);
  }
  return sources.owners;
}

/**
 * @lang zh-CN 验证工作副本来源与精确HEAD；不读取未提交源、不fetch/checkout或修改owner。
 * @lang en Checks checkout origin and exact HEAD without reading uncommitted sources, fetching/checking out or modifying the owner.
 * @param {string} root 本仓根。 / Repository root.
 * @param {object} owner 已核声明。 / Admitted source declaration.
 * @returns {string} 相邻Git仓路径。 / Sibling Git repository path.
 * @throws {Error} checkout/origin与声明不符。 / Checkout/origin differs from declaration.
 */
function verifyCheckout(root, owner) {
  const source = path.resolve(root, "..", owner.repository);
  const head = run("git", ["-C", source, "rev-parse", "HEAD"]).toString().trim();
  const origin = run("git", ["-C", source, "remote", "get-url", "origin"]).toString().trim();
  // <lang><zh-CN>Actions checkout使用无.git后缀的同一HTTPS仓址；只接纳这两种精确形式。</zh-CN><en>Actions checkout uses the same HTTPS repository without .git; admit only these two exact forms.</en></lang>
  const canonical = `https://github.com/mandolin/${owner.repository}`;
  if (head !== owner.commit || ![canonical, `${canonical}.git`].includes(origin)) {
    throw new Error("Pinned owner checkout and origin are required.");
  }
  return source;
}

/**
 * @lang zh-CN 计算实际归档SHA/SRI，不修改文件。
 * @lang en Computes actual archive SHA/SRI without modifying files.
 * @param {string} file 归档绝对路径。 / Absolute archive path.
 * @returns {object} sha256和integrity。 / sha256 and integrity.
 */
function digests(file) {
  const bytes = fs.readFileSync(file);
  return {sha256: crypto.createHash("sha256").update(bytes).digest("hex"), integrity: `sha512-${crypto.createHash("sha512").update(bytes).digest("base64")}`};
}

/**
 * @lang zh-CN 仅核本仓锁中声明owner的精确版本/来源/SRI，不改锁、不查询registry。
 * @lang en Checks declared owners' exact versions/sources/SRI in this repository's lock without rewriting it or querying the registry.
 * @param {string} root 本仓根。 / Repository root.
 * @returns {void} 通过时无返回。 / No return on success.
 * @throws {Error} 锁漂移。 / Lock drift.
 */
function verifyOwnerLock(root) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
  for (const owner of readSources(root)) {
    if (!/^sha512-[A-Za-z0-9+/]+=*$/u.test(owner.integrity) || !/^[a-f0-9]{64}$/u.test(owner.sha256)) throw new Error("Pinned owner archive integrity is required.");
    const entry = lock.packages?.[`node_modules/${owner.name}`];
    if (!entry || entry.link || entry.version !== owner.version || entry.resolved !== `file:.owner-packages/${owner.archive}` || entry.integrity !== owner.integrity) {
      throw new Error("Pinned owner lock identity, source or integrity drifted.");
    }
  }
}

/**
 * @lang zh-CN 准备当前仓库的固定开发归档并核摘要；只写本仓忽略缓存，错误缓存拒绝而非覆盖。
 * @lang en Prepares digest-checked development archives, writing only this repository's ignored cache and rejecting rather than overwriting corrupt cache entries.
 * @param {string} root 本仓根。 / Repository root.
 * @param {object} [options={}] discoverIntegrity仅供显式内部首次锁定/合成测试，正常CLI不启用。 / discoverIntegrity is only for explicit internal initial locking/synthetic tests, never normal CLI.
 * @returns {object[]} 无本地路径的来源/归档摘要回执。 / Source/archive receipts without local paths.
 * @throws {Error} 来源、摘要、缓存路径或打包错误；不安装或执行生命周期。 / Source/digest/cache-path/pack failure; never installs or runs lifecycle scripts.
 */
function prepareOwnerPackages(root, options = {}) {
  root = fs.realpathSync(root);
  const sources = readSources(root);
  // <lang><zh-CN>写缓存前先核所有来源，任一错误不先产生另一个owner的归档。</zh-CN><en>Check every source before cache writes so one invalid owner cannot first produce another owner's archive.</en></lang>
  const checkouts = sources.map((owner) => verifyCheckout(root, owner));
  const cache = path.join(root, ".owner-packages");
  if (fs.existsSync(cache) && fs.lstatSync(cache).isSymbolicLink()) throw new Error("Owner cache must stay inside this repository.");
  fs.mkdirSync(cache, {recursive: true});
  if (path.dirname(fs.realpathSync(cache)) !== root) throw new Error("Owner cache must stay inside this repository.");
  // <lang><zh-CN>npm run提供npm_execpath；直接Node调用兼容标准Windows/Unix Node发行布局，无额外下载。</zh-CN><en>npm run supplies npm_execpath; direct Node calls support standard Windows/Unix Node layouts without downloads.</en></lang>
  const npmCli = [process.env.npm_execpath, path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"), path.resolve(path.dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js")].find((file) => file && fs.existsSync(file));
  if (!npmCli) throw new Error("A local npm CLI is required to prepare owner archives.");
  return sources.map((owner, index) => {
    const file = path.join(cache, owner.archive);
    const reused = fs.existsSync(file);
    if (reused && fs.lstatSync(file).isSymbolicLink()) throw new Error("Owner archive must be a local cache file.");
    if (!options.discoverIntegrity && (!/^sha512-[A-Za-z0-9+/]+=*$/u.test(owner.integrity) || !/^[a-f0-9]{64}$/u.test(owner.sha256))) throw new Error("Pinned owner archive integrity is required.");
    if (!reused) {
      const snapshot = fs.mkdtempSync(path.join(cache, ".source-"));
      try {
        // <lang><zh-CN>Git归档精确提交而非工作树；tar只解包受信已固定Git内容到本仓独占目录。</zh-CN><en>Archive the exact commit rather than the worktree; tar extracts trusted pinned Git contents only into this repository's owned directory.</en></lang>
        const archive = run("git", ["-C", checkouts[index], "archive", "--format=tar", owner.commit]);
        run("tar", ["-xf", "-", "-C", snapshot], {input: archive});
        const manifest = JSON.parse(fs.readFileSync(path.join(snapshot, "package.json"), "utf8"));
        if (manifest.name !== owner.name || manifest.version !== owner.version || manifest.license !== "MIT") throw new Error("Pinned owner package identity is invalid.");
        const packed = JSON.parse(run(process.execPath, [npmCli, "pack", "--ignore-scripts", "--json", "--pack-destination", cache], {cwd: snapshot}).toString());
        if (packed.length !== 1 || packed[0].filename !== owner.archive) throw new Error("Pinned owner archive filename is invalid.");
      } finally {
        // <lang><zh-CN>递归清理前核实际父与固定前缀；不清除缓存归档或相邻owner。</zh-CN><en>Before recursive cleanup, check the physical parent and fixed prefix; never remove cached archives or sibling owners.</en></lang>
        const actual = fs.realpathSync(snapshot);
        if (path.dirname(actual) !== fs.realpathSync(cache) || !path.basename(actual).startsWith(".source-")) throw new Error("Owner snapshot cleanup boundary changed.");
        fs.rmSync(actual, {recursive: true, force: true});
      }
    }
    const actual = digests(file);
    if (!options.discoverIntegrity && (actual.integrity !== owner.integrity || actual.sha256 !== owner.sha256)) throw new Error("Pinned owner archive integrity mismatch.");
    return {name: owner.name, version: owner.version, commit: owner.commit, archive: owner.archive, ...actual, reused};
  });
}

module.exports = {prepareOwnerPackages, verifyOwnerLock};
if (require.main === module) {
  try { console.log(JSON.stringify(prepareOwnerPackages(path.resolve(__dirname, "..")), null, 2)); }
  catch { console.error("Owner package preparation failed: verify pinned sources and archive integrity."); process.exitCode = 1; }
}
