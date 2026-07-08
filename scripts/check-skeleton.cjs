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
  "pnpm-workspace.yaml",
  "examples/basic/README.md",
  "fixtures/README.md",
  "test/README.md",
  "packages/jsdoc-spec/package.json",
  "packages/jsdoc-preset/package.json",
  "packages/jsdoc-runner/package.json",
  "packages/jsdoc-plugin-hia-bridge/package.json",
  "packages/jsdoc-theme-bridge/package.json",
  "packages/jsdoc-extra-plugin-registry/package.json",
  "packages/jsdoc-doc-source-map/package.json"
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
