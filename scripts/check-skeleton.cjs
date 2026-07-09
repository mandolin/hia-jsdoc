const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const requiredPaths = [
  "README.md",
  "CHANGELOG.md",
  "RELEASE_CHECKLIST.md",
  "THIRD_PARTY_NOTICES.md",
  "LICENSE",
  "package.json",
  "package-lock.json",
  "pnpm-workspace.yaml",
  "examples/basic/README.md",
  "fixtures/README.md",
  "fixtures/basic/src/math.js",
  "fixtures/basic/generated/jsdoc.conf.json",
  "fixtures/basic/out/hia-integration.json",
  "fixtures/basic/out/hia-metadata.json",
  "fixtures/basic/out/index.html",
  "test/README.md",
  "test/hia-jsdoc.test.mjs",
  "packages/jsdoc-spec/package.json",
  "packages/jsdoc-spec/src/index.mjs",
  "packages/jsdoc-preset/package.json",
  "packages/jsdoc-preset/src/index.mjs",
  "packages/jsdoc-runner/package.json",
  "packages/jsdoc-runner/src/index.mjs",
  "packages/jsdoc-plugin-hia-bridge/package.json",
  "packages/jsdoc-plugin-hia-bridge/src/index.mjs",
  "packages/jsdoc-theme-bridge/package.json",
  "packages/jsdoc-theme-bridge/src/index.mjs",
  "packages/jsdoc-extra-plugin-registry/package.json",
  "packages/jsdoc-extra-plugin-registry/src/index.mjs",
  "packages/jsdoc-doc-source-map/package.json",
  "packages/jsdoc-doc-source-map/src/index.mjs",
  "scripts/build-fixtures.cjs",
  "scripts/check-fixtures.cjs"
];

let failed = false;

for (const relativePath of requiredPaths) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing required skeleton path: ${relativePath}`);
    failed = true;
  }
}

const rootPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (rootPackage.private !== true) {
  console.error("Root package must stay private until JSDoc umbrella package names are finalized.");
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("HIA JSDoc skeleton check passed.");
