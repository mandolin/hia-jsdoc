const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const requiredFiles = ["README.md", "CHANGELOG.md", "RELEASE_CHECKLIST.md", "THIRD_PARTY_NOTICES.md", "LICENSE"];

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  const content = fs.readFileSync(fullPath, "utf8").trim();
  if (!content) {
    console.error(`Release file is empty: ${file}`);
    process.exit(1);
  }
}

const rootPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (rootPackage.private !== true) {
  console.error("HIA JSDoc skeleton release check requires private=true.");
  process.exit(1);
}

const fixtureConfig = JSON.parse(fs.readFileSync(path.join(root, "fixtures/basic/generated/jsdoc.conf.json"), "utf8"));
if (!fixtureConfig.plugins?.includes("node_modules/@mandolin/jsdoc-plugin-hia-sys/src/index.cjs")) {
  console.error("Generated fixture config must use the published JPHS package path.");
  process.exit(1);
}
if (fixtureConfig.opts?.template !== "node_modules/@mandolin/jsdoc-theme-hia") {
  console.error("Generated fixture config must use the published JTH package path.");
  process.exit(1);
}
if (fs.existsSync(path.join(root, "hia-doc-hia-jsdoc-workspace-0.0.0.tgz"))) {
  console.error("Dry-run tarball must not remain in the workspace.");
  process.exit(1);
}

console.log("HIA JSDoc release check passed.");
