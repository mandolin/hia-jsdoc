const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const fixtureRoot = path.join(root, "fixtures", "basic");
const outputRoot = path.join(fixtureRoot, "out");
const generatedRoot = path.join(fixtureRoot, "generated");
const selfDocInputPaths = [
  "packages/jsdoc-doc-source-map/src",
  "packages/jsdoc-extra-plugin-registry/src",
  "packages/jsdoc-plugin-hia-bridge/src",
  "packages/jsdoc-preset/src",
  "packages/jsdoc-producer/src",
  "packages/jsdoc-runner/src",
  "packages/jsdoc-spec/src",
  "packages/jsdoc-theme-bridge/src"
];
let jsdocRunner;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  jsdocRunner = await import(pathToFileURL(path.join(root, "packages", "jsdoc-runner", "src", "index.mjs")));

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.rmSync(generatedRoot, { recursive: true, force: true });

  await buildBasicFixture();
  await buildSelfDocFixture();

  console.log("HIA JSDoc fixture output generated.");
}

async function buildBasicFixture() {
  const result = jsdocRunner.runHiaJsdoc({
    cwd: root,
    configPath: "fixtures/basic/generated/jsdoc.conf.json",
    mode: "both",
    source: {
      include: ["fixtures/basic/src"]
    },
    destination: "fixtures/basic/out",
    integrationOutputFile: "fixtures/basic/out/hia-integration.json",
    hia: {
      source: {
        basePath: ".",
        link: {
          rootUrl: "https://example.invalid/hia-jsdoc"
        }
      },
      theme: {
        code: {
          fontFamily: "sarasa"
        }
      }
    }
  });

  if (!result.ok) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

async function buildSelfDocFixture() {
  const selfDocRoot = path.join(root, "fixtures", "self-doc");
  const selfDocOutput = path.join(selfDocRoot, "out");
  fs.rmSync(selfDocOutput, { recursive: true, force: true });

  // 中文：W-P13.2 将自文档化 fixture 从单包试点扩展到 hia-jsdoc umbrella package set。
  // English: W-P13.2 expands the self-doc fixture from one package to the full hia-jsdoc umbrella package set.
  const result = jsdocRunner.runHiaJsdocProject({
    workspaceRoot: root,
    outputDirectory: selfDocOutput,
    inputs: selfDocInputPaths.map((inputPath) => ({
      kind: "javascript-module",
      path: inputPath
    })),
    options: {
      includePattern: ".+\\.mjs$",
      writeResultManifest: true,
      hia: {
        i18n: {
          enabled: true,
          defaultLocale: "en",
          fallbackLocale: "en",
          locales: ["en", "zh-CN"]
        },
        theme: {
          code: {
            fontFamily: "sarasa"
          }
        }
      }
    }
  });

  if (result.status !== "success") {
    process.stderr.write(JSON.stringify(result.diagnostics, null, 2));
    process.exit(1);
  }
}
