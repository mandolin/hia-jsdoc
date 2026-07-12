const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const inventoryFile = path.join(root, "fixtures", "self-doc", "out", "self-doc-inventory.json");

function main() {
  const inventory = JSON.parse(fs.readFileSync(inventoryFile, "utf8"));
  assert.equal(inventory.contract, "hia-self-doc-inventory");
  assert.equal(inventory.contractVersion, "0.1.0-draft");
  assert.equal(inventory.scope.packageSetName, "hia-jsdoc-umbrella-packages");
  assert.ok(Array.isArray(inventory.scope.packages));
  assert.ok(inventory.scope.packages.length >= 8);
  assert.equal(inventory.policy.canonicalI18nTag, "@lang");
  assert.equal(inventory.policy.earlyCompatibleTag, "@hiaText");
  assert.equal(inventory.gate.status, "pass", "self-doc inventory gate must pass for W-P13.2");
  assert.equal(inventory.summary.packageCount, inventory.scope.packages.length);
  assert.ok(inventory.summary.exportCount >= 1);
  assert.equal(inventory.summary.exportCount, inventory.summary.documentedExportCount);
  assert.equal(inventory.summary.exportCount, inventory.summary.integrationCoveredCount);
  assert.equal(inventory.summary.exportCount, inventory.summary.bilingualExportCount);
  assert.equal(inventory.summary.missingLocaleFieldCount, 0);
  assert.equal(inventory.summary.rawMissingLocaleFieldCount, 0);
  assert.equal(inventory.summary.invalidInlineLangTagCount, 0, "inline <lang> tags must use canonical child-locale syntax.");
  assert.equal(inventory.summary.malformedInlineLangDiagnosticCount, 0, "integration output must not contain malformed inline lang diagnostics.");

  for (const packageReport of inventory.packages) {
    assert.ok(packageReport.packageName, "package report must include packageName.");
    assert.ok(packageReport.summary.exportCount >= 1, `${packageReport.packageName} must expose at least one public export.`);
    assert.equal(packageReport.summary.exportCount, packageReport.summary.documentedExportCount, `${packageReport.packageName} must document every public export.`);
    assert.equal(packageReport.summary.exportCount, packageReport.summary.integrationCoveredCount, `${packageReport.packageName} must cover every public export in integration output.`);
    assert.equal(packageReport.summary.exportCount, packageReport.summary.bilingualExportCount, `${packageReport.packageName} must have bilingual @lang docs for every public export.`);
    assert.equal(packageReport.summary.missingLocaleFieldCount, 0, `${packageReport.packageName} must not have final i18n missing fields.`);
    assert.equal(packageReport.summary.rawMissingLocaleFieldCount, 0, `${packageReport.packageName} must not have effective raw missing locale fields.`);
  }

  for (const item of inventory.publicExports) {
    const label = `${item.packageName}:${item.name}`;
    assert.equal(item.hasDocBlock, true, `${label} must have an adjacent JSDoc block.`);
    assert.equal(item.integrationCovered, true, `${label} must be covered by HIA integration output.`);
    assert.ok(item.docBlockLocales.includes("en"), `${label} must include @lang en.`);
    assert.ok(item.docBlockLocales.includes("zh-CN"), `${label} must include @lang zh-CN.`);
    assert.equal(item.hasEarlyCompatibleHiaText, false, `${label} must not use early @hiaText/@hiaBlock syntax.`);
    assert.equal(item.i18n.missingLocaleFieldCount, 0, `${label} must not have missing i18n fields.`);
    assert.equal(item.i18n.rawMissingLocaleFieldCount, 0, `${label} must not have effective raw missing locale fields.`);
  }

  console.log("HIA JSDoc self-doc inventory check passed.");
}

main();
