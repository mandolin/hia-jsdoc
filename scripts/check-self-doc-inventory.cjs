const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const inventoryFile = path.join(root, "fixtures", "self-doc", "out", "self-doc-inventory.json");

function main() {
  const inventory = JSON.parse(fs.readFileSync(inventoryFile, "utf8"));
  assert.equal(inventory.contract, "hia-self-doc-inventory");
  assert.equal(inventory.contractVersion, "0.1.0-draft");
  assert.equal(inventory.scope.packageName, "@hia-doc/jsdoc-spec");
  assert.equal(inventory.policy.canonicalI18nTag, "@lang");
  assert.equal(inventory.policy.earlyCompatibleTag, "@hiaText");
  assert.equal(inventory.gate.status, "pass", "self-doc inventory gate must pass for W-P12.5");
  assert.ok(inventory.summary.exportCount >= 1);
  assert.equal(inventory.summary.exportCount, inventory.summary.documentedExportCount);
  assert.equal(inventory.summary.exportCount, inventory.summary.integrationCoveredCount);
  assert.equal(inventory.summary.exportCount, inventory.summary.bilingualExportCount);
  assert.equal(inventory.summary.missingLocaleFieldCount, 0);

  for (const item of inventory.publicExports) {
    assert.equal(item.hasDocBlock, true, `${item.name} must have an adjacent JSDoc block.`);
    assert.equal(item.integrationCovered, true, `${item.name} must be covered by HIA integration output.`);
    assert.ok(item.docBlockLocales.includes("en"), `${item.name} must include @lang en.`);
    assert.ok(item.docBlockLocales.includes("zh-CN"), `${item.name} must include @lang zh-CN.`);
    assert.equal(item.hasEarlyCompatibleHiaText, false, `${item.name} must not use early @hiaText/@hiaBlock syntax.`);
    assert.equal(item.i18n.missingLocaleFieldCount, 0, `${item.name} must not have missing i18n fields.`);
  }

  console.log("HIA JSDoc self-doc inventory check passed.");
}

main();
