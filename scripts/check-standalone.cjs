const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "examples", "standalone", "dist", "hia-jsdoc");
const manifestPath = path.join(output, "hia-jsdoc.producer-result.json");

if (!fs.existsSync(manifestPath)) {
  console.error("Missing HIA JSDoc standalone result manifest.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
let failed = false;

if (manifest.contract !== "documentation-producer-result" || manifest.status !== "success") {
  console.error("Invalid HIA JSDoc standalone result contract or status.");
  failed = true;
}
if (!manifest.artifacts?.some((artifact) => artifact.kind === "jsdoc-integration")) {
  console.error("HIA JSDoc standalone result must include jsdoc-integration.");
  failed = true;
}

for (const artifact of manifest.artifacts ?? []) {
  const artifactPath = path.join(output, artifact.path);
  if (!fs.existsSync(artifactPath)) {
    console.error(`Missing HIA JSDoc standalone artifact: ${artifact.path}`);
    failed = true;
  }
}

const serialized = listFiles(output)
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");
for (const marker of ["K:\\Project", "Github_mandolin", "HIA-Documentation-Sys"]) {
  if (serialized.includes(marker)) {
    console.error(`Local path leakage in HIA JSDoc standalone output: ${marker}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`HIA JSDoc standalone example check passed: ${manifest.artifacts.length} artifacts.`);

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}
