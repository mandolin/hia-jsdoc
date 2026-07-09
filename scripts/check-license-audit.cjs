const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const reviewedExternalPackages = new Map([
  ["@babel/helper-string-parser", { version: "7.29.7", license: "MIT" }],
  ["@babel/helper-validator-identifier", { version: "7.29.7", license: "MIT" }],
  ["@babel/parser", { version: "7.29.7", license: "MIT" }],
  ["@babel/types", { version: "7.29.7", license: "MIT" }],
  ["@jsdoc/salty", { version: "0.2.12", license: "Apache-2.0" }],
  ["@mandolin/jsdoc-plugin-hia-sys", { version: "0.1.0", license: "MIT" }],
  ["@mandolin/jsdoc-theme-hia", { version: "0.1.0", license: "MIT" }],
  ["@types/linkify-it", { version: "5.0.0", license: "MIT" }],
  ["@types/markdown-it", { version: "14.1.2", license: "MIT" }],
  ["@types/mdurl", { version: "2.0.0", license: "MIT" }],
  ["argparse", { version: "2.0.1", license: "Python-2.0" }],
  ["bluebird", { version: "3.7.2", license: "MIT" }],
  ["catharsis", { version: "0.9.0", license: "MIT" }],
  ["entities", { version: "4.5.0", license: "BSD-2-Clause" }],
  ["escape-string-regexp", { version: "2.0.0", license: "MIT" }],
  ["graceful-fs", { version: "4.2.11", license: "ISC" }],
  ["js2xmlparser", { version: "4.0.2", license: "Apache-2.0" }],
  ["jsdoc", { version: "4.0.5", license: "Apache-2.0" }],
  ["klaw", { version: "3.0.0", license: "MIT" }],
  ["linkify-it", { version: "5.0.2", license: "MIT" }],
  ["lodash", { version: "4.18.1", license: "MIT" }],
  ["markdown-it", { version: "14.3.0", license: "MIT" }],
  ["markdown-it-anchor", { version: "8.6.7", license: "Unlicense" }],
  ["marked", { version: "4.3.0", license: "MIT" }],
  ["mdurl", { version: "2.0.0", license: "MIT" }],
  ["mkdirp", { version: "1.0.4", license: "MIT" }],
  ["punycode.js", { version: "2.3.1", license: "MIT" }],
  ["requizzle", { version: "0.2.4", license: "MIT" }],
  ["strip-json-comments", { version: "3.1.1", license: "MIT" }],
  ["uc.micro", { version: "2.1.0", license: "MIT" }],
  ["underscore", { version: "1.13.8", license: "MIT" }],
  ["xmlcreate", { version: "2.0.4", license: "Apache-2.0" }]
]);

const lockPath = path.join(root, "package-lock.json");
if (!fs.existsSync(lockPath)) {
  console.error("package-lock.json is required after adding reviewed JSDoc umbrella dependencies.");
  process.exit(1);
}

const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
let failed = false;
const seen = new Set();

for (const [packagePath, entry] of Object.entries(lock.packages || {})) {
  if (!packagePath.includes("node_modules/") || entry.link) {
    continue;
  }
  const packageName = getExternalPackageName(packagePath);
  if (!packageName || packageName.startsWith("@hia-doc/")) {
    continue;
  }
  seen.add(packageName);
  const expected = reviewedExternalPackages.get(packageName);
  const packageJsonPath = path.join(root, packagePath, "package.json");
  const packageJson = fs.existsSync(packageJsonPath) ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) : {};
  const license = typeof packageJson.license === "string" ? packageJson.license : JSON.stringify(packageJson.license ?? null);

  if (!expected) {
    console.error(`Unreviewed external dependency in lockfile: ${packageName}`);
    failed = true;
    continue;
  }
  if (entry.version !== expected.version) {
    console.error(`Unexpected version for ${packageName}: ${entry.version}, expected ${expected.version}`);
    failed = true;
  }
  if (license !== expected.license) {
    console.error(`Unexpected license for ${packageName}: ${license}, expected ${expected.license}`);
    failed = true;
  }
  if (typeof entry.resolved === "string" && !entry.resolved.startsWith("https://registry.npmjs.org/")) {
    console.error(`Unexpected registry for ${packageName}: ${entry.resolved}`);
    failed = true;
  }
}

for (const packageName of reviewedExternalPackages.keys()) {
  if (!seen.has(packageName)) {
    console.error(`Reviewed dependency missing from lockfile: ${packageName}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("HIA JSDoc license audit passed: JSDoc, JPHS, JTH and transitive dependencies are reviewed.");

function getExternalPackageName(packagePath) {
  const rest = packagePath.split("node_modules/").at(-1).split("/");
  if (rest[0]?.startsWith("@")) {
    return `${rest[0]}/${rest[1]}`;
  }
  return rest[0];
}
