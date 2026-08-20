const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const fixtureRoot = path.join(root, "fixtures", "basic");
const outputRoot = path.join(fixtureRoot, "out");
const selfDocRoot = path.join(root, "fixtures", "self-doc");
const selfDocOutput = path.join(selfDocRoot, "out");

let failed = false;

const config = readJson(path.join(fixtureRoot, "generated", "jsdoc.conf.json"));
const integration = readJson(path.join(outputRoot, "hia-integration.json"));
const metadata = readJson(path.join(outputRoot, "hia-metadata.json"));
const selfDocIntegration = readJson(path.join(selfDocOutput, "hia-integration.json"));
const selfDocManifest = readJson(path.join(selfDocOutput, "hia-jsdoc.producer-result.json"));

expectArrayContains(config.plugins, "node_modules/@mandolin/jsdoc-plugin-hia-sys/src/index.cjs", "JSDoc plugin list");
expectEqual(config.opts?.template, "node_modules/@mandolin/jsdoc-theme-hia", "JSDoc theme template");
expectEqual(config.opts?.hia?.integration?.enabled, true, "HIA integration enabled");
expectEqual(config.opts?.hia?.integration?.outputFile, "fixtures/basic/out/hia-integration.json", "HIA integration output path");
expectEqual(config.opts?.hia?.umbrella?.contract, "hia-jsdoc-umbrella-config", "Umbrella config contract");
expectEqual(config.opts?.hia?.presentation?.pageMode, "multi-page", "Presentation page default");
expectEqual(config.opts?.hia?.presentation?.sourceMode, "fetch", "Presentation source default");
expectEqual(config.opts?.hia?.theme?.scheme, "system", "Presentation scheme default");
expectEqual(config.opts?.hia?.umbrella?.themeBridge?.presentation?.contract, "documentation-presentation-profile", "Theme bridge presentation contract");
expectEqual(config.opts?.hia?.umbrella?.themeBridge?.presentation?.skinCatalog?.ownerPackage, "@mandolin/jsdoc-theme-hia", "Theme bridge skin catalog owner");

expectEqual(integration.contract, "hia-jsdoc-integration", "Integration contract");
expectEqual(integration.contractVersion, "0.1.0", "Integration contract version");
expectEqual(integration.artifactKind, "hia-integration", "Integration artifact kind");
expectSymbolLike(integration, "add");
if (!Array.isArray(metadata) || metadata.length === 0) {
  fail("Theme metadata must contain at least one doclet metadata entry.");
}
expectSymbolLike({ metadata }, "Calculator");
expectEqual(selfDocManifest.contract, "documentation-producer-result", "Self-doc producer result contract");
expectEqual(selfDocManifest.status, "success", "Self-doc producer result status");
expectSymbolLike(selfDocIntegration, "createHiaJsdocVersionSummary");
expectSymbolLike(selfDocIntegration, "zh-CN");

for (const requiredFile of ["index.html", "search-index.json", "hia-theme.css", "hia-theme.js"]) {
  if (!fs.existsSync(path.join(outputRoot, requiredFile))) {
    fail(`Missing generated JSDoc output file: ${requiredFile}`);
  }
}

const presentationProfile = readJson(path.join(selfDocOutput, "documentation-presentation-profile.json"));
const pageMap = readJson(path.join(selfDocOutput, "hia-page-map.json"));
expectEqual(presentationProfile.contract, "documentation-presentation-profile", "Presentation profile contract");
expectEqual(presentationProfile.pagePartition?.mode, "multi-page", "Presentation profile page mode");
expectEqual(presentationProfile.source?.mode, "fetch", "Presentation profile source mode");
expectEqual(presentationProfile.theme?.skins?.length, 3, "Presentation profile skin count");
expectEqual(pageMap.contract, "jsdoc-theme-hia/page-map", "JTH page-map contract");
if (!Array.isArray(pageMap.pages) || pageMap.pages.length === 0) {
  fail("JTH page map must contain at least one page.");
}
if (/"sourceBody"\s*:/.test(JSON.stringify(presentationProfile))) {
  fail("Presentation profile must not contain sourceBody.");
}

expectNoLocalPathLeakage(fixtureRoot);
expectNoLocalPathLeakage(selfDocRoot);

if (failed) {
  process.exit(1);
}

console.log("HIA JSDoc fixture check passed.");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing fixture JSON: ${path.relative(root, filePath).replaceAll("\\", "/")}`);
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function expectSymbolLike(integration, name) {
  const text = JSON.stringify(integration);
  if (!text.includes(name)) {
    fail(`Expected integration artifact to mention ${name}.`);
  }
}

function expectArrayContains(value, expected, label) {
  if (!Array.isArray(value) || !value.includes(expected)) {
    fail(`${label}: expected to include ${expected}`);
  }
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

function expectNoLocalPathLeakage(directory) {
  const forbidden = [
    "K:\\Project",
    "Github_mandolin",
    "HIA-Documentation-Sys"
  ];
  for (const filePath of listFiles(directory)) {
    const content = fs.readFileSync(filePath, "utf8");
    for (const marker of forbidden) {
      if (content.includes(marker)) {
        fail(`Local path leakage in ${path.relative(root, filePath).replaceAll("\\", "/")}: ${marker}`);
      }
    }
  }
}

function listFiles(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...listFiles(entryPath));
    } else {
      result.push(entryPath);
    }
  }
  return result;
}

function fail(message) {
  console.error(message);
  failed = true;
}
