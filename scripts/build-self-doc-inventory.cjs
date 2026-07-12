const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const integrationFile = path.join(root, "fixtures", "self-doc", "out", "hia-integration.json");
const inventoryFile = path.join(root, "fixtures", "self-doc", "out", "self-doc-inventory.json");
const requiredLocales = ["en", "zh-CN"];
const selfDocPackages = [
  {
    packageName: "@hia-doc/jsdoc-doc-source-map",
    sourceRoot: "packages/jsdoc-doc-source-map/src",
    sourceFiles: ["index.mjs"]
  },
  {
    packageName: "@hia-doc/jsdoc-extra-plugin-registry",
    sourceRoot: "packages/jsdoc-extra-plugin-registry/src",
    sourceFiles: ["index.mjs"]
  },
  {
    packageName: "@hia-doc/jsdoc-plugin-hia-bridge",
    sourceRoot: "packages/jsdoc-plugin-hia-bridge/src",
    sourceFiles: ["index.mjs"]
  },
  {
    packageName: "@hia-doc/jsdoc-preset",
    sourceRoot: "packages/jsdoc-preset/src",
    sourceFiles: ["index.mjs"]
  },
  {
    packageName: "@hia-doc/jsdoc-producer",
    sourceRoot: "packages/jsdoc-producer/src",
    sourceFiles: ["index.mjs"]
  },
  {
    packageName: "@hia-doc/jsdoc-runner",
    sourceRoot: "packages/jsdoc-runner/src",
    sourceFiles: ["index.mjs", "schema.mjs"]
  },
  {
    packageName: "@hia-doc/jsdoc-spec",
    sourceRoot: "packages/jsdoc-spec/src",
    sourceFiles: ["index.mjs"]
  },
  {
    packageName: "@hia-doc/jsdoc-theme-bridge",
    sourceRoot: "packages/jsdoc-theme-bridge/src",
    sourceFiles: ["index.mjs"]
  }
];

function main() {
  const integration = JSON.parse(fs.readFileSync(integrationFile, "utf8"));
  const integrationNodes = new Map((integration.ir?.nodes ?? []).map((node) => [node.name, node]));
  const packageReports = selfDocPackages.map((packageInfo) => collectPackageReport(packageInfo, integrationNodes));
  const publicExports = packageReports.flatMap((packageReport) => packageReport.publicExports);
  const summary = {
    packageCount: packageReports.length,
    coveredPackageCount: packageReports.filter((packageReport) => packageReport.summary.exportCount === packageReport.summary.integrationCoveredCount).length,
    bilingualPackageCount: packageReports.filter((packageReport) => packageReport.summary.exportCount === packageReport.summary.bilingualExportCount).length,
    exportCount: publicExports.length,
    documentedExportCount: publicExports.filter((item) => item.hasDocBlock).length,
    integrationCoveredCount: publicExports.filter((item) => item.integrationCovered).length,
    bilingualExportCount: publicExports.filter((item) => item.docBlockLocales.includes("en") && item.docBlockLocales.includes("zh-CN")).length,
    missingLocaleFieldCount: publicExports.reduce((total, item) => total + item.i18n.missingLocaleFieldCount, 0),
    rawMissingLocaleFieldCount: publicExports.reduce((total, item) => total + item.i18n.rawMissingLocaleFieldCount, 0),
    staleRawMissingLocaleFieldCount: publicExports.reduce((total, item) => total + item.i18n.staleRawMissingLocaleFieldCount, 0)
  };

  const inventory = {
    contract: "hia-self-doc-inventory",
    contractVersion: "0.1.0-draft",
    scope: {
      repository: "HIA/hia-jsdoc",
      packageSetName: "hia-jsdoc-umbrella-packages",
      packages: selfDocPackages.map((packageInfo) => ({
        packageName: packageInfo.packageName,
        sourceRoot: packageInfo.sourceRoot,
        sourceFiles: packageInfo.sourceFiles
      })),
      artifactPath: "fixtures/self-doc/out/hia-integration.json"
    },
    policy: {
      defaultLocale: "en",
      requiredLocales,
      canonicalI18nTag: "@lang",
      earlyCompatibleTag: "@hiaText"
    },
    summary,
    packages: packageReports,
    publicExports,
    gate: {
      status: summary.exportCount === summary.documentedExportCount
        && summary.exportCount === summary.integrationCoveredCount
        && summary.exportCount === summary.bilingualExportCount
        && summary.missingLocaleFieldCount === 0
        && summary.rawMissingLocaleFieldCount === 0
        ? "pass"
        : "baseline-with-gaps",
      requiredForW13_2: [
        "all umbrella package public exports have adjacent JSDoc blocks",
        "all umbrella package public exports appear in HIA JSDoc integration output",
        "all umbrella package public exports carry @lang en and @lang zh-CN",
        "generated i18n fields have no missing required locale",
        "raw missing locale diagnostics are effective gaps, not stale localizedText false positives"
      ],
      carriedFromW12_5: [
        "all public exports have adjacent JSDoc blocks",
        "all public exports appear in HIA JSDoc integration output",
        "all public exports carry @lang en and @lang zh-CN",
        "generated i18n fields have no missing required locale"
      ]
    }
  };

  fs.writeFileSync(inventoryFile, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
  console.log("HIA JSDoc self-doc inventory generated.");
}

function collectPackageReport(packageInfo, integrationNodes) {
  const publicExports = packageInfo.sourceFiles.flatMap((sourceFileName) => {
    const relativePath = `${packageInfo.sourceRoot}/${sourceFileName}`;
    const sourceText = fs.readFileSync(path.join(root, relativePath), "utf8");
    return collectPublicExports(sourceText, packageInfo, relativePath).map((item) => {
      const integrationNode = integrationNodes.get(item.name);
      const i18nReport = integrationNode ? summarizeI18n(integrationNode, requiredLocales) : createEmptyI18nReport();

      return {
        ...item,
        integrationCovered: Boolean(integrationNode),
        integrationNodeId: integrationNode?.id ?? null,
        i18n: i18nReport
      };
    });
  });

  return {
    packageName: packageInfo.packageName,
    sourceRoot: packageInfo.sourceRoot,
    sourceFiles: packageInfo.sourceFiles,
    summary: {
      exportCount: publicExports.length,
      documentedExportCount: publicExports.filter((item) => item.hasDocBlock).length,
      integrationCoveredCount: publicExports.filter((item) => item.integrationCovered).length,
      bilingualExportCount: publicExports.filter((item) => item.docBlockLocales.includes("en") && item.docBlockLocales.includes("zh-CN")).length,
      missingLocaleFieldCount: publicExports.reduce((total, item) => total + item.i18n.missingLocaleFieldCount, 0),
      rawMissingLocaleFieldCount: publicExports.reduce((total, item) => total + item.i18n.rawMissingLocaleFieldCount, 0),
      staleRawMissingLocaleFieldCount: publicExports.reduce((total, item) => total + item.i18n.staleRawMissingLocaleFieldCount, 0)
    },
    publicExports
  };
}

function collectPublicExports(sourceText, packageInfo, relativePath) {
  const result = [];
  const pattern = /(?:(\/\*\*[\s\S]*?\*\/)\s*)?export\s+(const|function|class)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of sourceText.matchAll(pattern)) {
    const docBlock = match[1] ?? "";
    const start = match.index ?? 0;
    result.push({
      packageName: packageInfo.packageName,
      name: match[3],
      kind: match[2],
      path: relativePath,
      line: sourceText.slice(0, start).split(/\r?\n/).length,
      hasDocBlock: Boolean(docBlock),
      docBlockLocales: collectDocBlockLocales(docBlock),
      hasCanonicalLang: /@lang\s+/.test(docBlock),
      hasEarlyCompatibleHiaText: /@hia(?:Text|Block)\b/.test(docBlock)
    });
  }
  return result;
}

function collectDocBlockLocales(docBlock) {
  return Array.from(new Set(Array.from(docBlock.matchAll(/@lang\s+([A-Za-z][\w-]*)/g)).map((match) => match[1]))).sort();
}

function summarizeI18n(node, requiredLocales) {
  const fields = node.i18n?.fields ?? {};
  const missingFields = [];
  const rawMissingFields = [];
  const staleRawMissingFields = [];
  for (const [fieldPath, field] of Object.entries(fields)) {
    const localizedText = field.localizedText ?? {};
    const missingLocales = requiredLocales.filter((locale) => typeof localizedText[locale] !== "string" || localizedText[locale].length === 0);
    if (missingLocales.length > 0) {
      missingFields.push({
        fieldPath,
        missingLocales
      });
    }
    if (Array.isArray(field.missingLocales) && field.missingLocales.length > 0) {
      const effectiveMissingLocales = field.missingLocales.filter((locale) => typeof localizedText[locale] !== "string" || localizedText[locale].length === 0);
      if (effectiveMissingLocales.length > 0) {
        rawMissingFields.push({
          fieldPath,
          missingLocales: effectiveMissingLocales
        });
      } else {
        staleRawMissingFields.push({
          fieldPath,
          originalMissingLocales: field.missingLocales
        });
      }
    }
  }

  return {
    enabled: Boolean(node.i18n?.enabled),
    locales: node.i18n?.locales ?? [],
    fieldCount: Object.keys(fields).length,
    missingLocaleFieldCount: missingFields.length,
    missingFields,
    rawMissingLocaleFieldCount: rawMissingFields.length,
    rawMissingFields,
    staleRawMissingLocaleFieldCount: staleRawMissingFields.length,
    staleRawMissingFields
  };
}

function createEmptyI18nReport() {
  return {
    enabled: false,
    locales: [],
    fieldCount: 0,
    missingLocaleFieldCount: 0,
    missingFields: [],
    rawMissingLocaleFieldCount: 0,
    rawMissingFields: [],
    staleRawMissingLocaleFieldCount: 0,
    staleRawMissingFields: []
  };
}

main();
