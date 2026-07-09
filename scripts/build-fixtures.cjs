const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const fixtureRoot = path.join(root, "fixtures", "basic");
const outputRoot = path.join(fixtureRoot, "out");
const generatedRoot = path.join(fixtureRoot, "generated");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const { runHiaJsdoc } = await import(pathToFileURL(path.join(root, "packages", "jsdoc-runner", "src", "index.mjs")));

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.rmSync(generatedRoot, { recursive: true, force: true });

  const result = runHiaJsdoc({
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

  console.log("HIA JSDoc fixture output generated.");
}
