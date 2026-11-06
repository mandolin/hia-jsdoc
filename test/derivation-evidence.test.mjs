/** @file @lang zh-CN 包根侧车的分发、精确草案身份和实际字节检查，语义核验由SDK/独立分析另行执行。 @lang en Package-root sidecar distribution, exact draft identity and actual byte checks; SDK/independent analysis separately verify semantics. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { execFileSync } from "node:child_process";

// <lang><zh-CN>仅检查本包分发根，不依赖开发机多仓布局。</zh-CN><en>Check this package's distribution root only, without relying on a development multi-repository layout.</en></lang>
const root=fileURLToPath(new URL("../packages/jsdoc-runner/",import.meta.url));
const relative="evidence/hia-jsdoc-config-1.0.0.derivation-evidence-0.1.0-draft.json";
const read=()=>JSON.parse(fs.readFileSync(path.join(root,relative),"utf8"));
test("exports the explicit draft evidence file alongside its source and output resources",()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
 assert.equal(manifest.exports["./"+relative],"./"+relative);
 assert(manifest.files.includes("evidence"));
 const evidence=read();
 assert.equal(evidence.contract,"artifact-derivation-evidence");assert.equal(evidence.contractVersion,"0.1.0-draft");assert.equal(evidence.evidenceOrigin,"producer-recorded");
 assert.equal(evidence.activities[0].profile.contract,"plain-data-initialization");assert.equal(evidence.activities[0].profile.contractVersion,"0.1.0-draft");
 assert.equal(evidence.details.produce.result.bindingName,"HIA_JSDOC_CONFIG_JSON_SCHEMA");
});
test("pins actual package-root source and schema bytes without granting semantic trust",()=>{
 const evidence=read();assert.equal(evidence.resources.length,3);
 assert.deepEqual(evidence.resources.map(row=>row.path).sort(),["src/schema.mjs","src/schema-legacy.mjs","schemas/hia-jsdoc-config-1.0.0.schema.json"].sort());
 for(const resource of evidence.resources){
  const file=path.join(root,resource.path);const state=fs.lstatSync(file);
  assert(state.isFile() && !state.isSymbolicLink() && state.nlink===1);assert.equal(fs.realpathSync(file),file);
  assert.equal(createHash("sha256").update(fs.readFileSync(file)).digest("hex"),resource.sha256);
 }
});
test("keeps digest-bound files in canonical LF across platform checkouts",()=>{
 const repository=fileURLToPath(new URL("../",import.meta.url));
 const files=[...read().resources.map(resource=>"packages/jsdoc-runner/"+resource.path),"packages/jsdoc-runner/"+relative,"packages/jsdoc-runner/schemas/hia-jsdoc-config-0.1.0-draft.schema.json"];
 const attributes=execFileSync("git",["-C",repository,"check-attr","eol","--",...files],{encoding:"utf8"}).trim().split(/\r?\n/);
 assert.equal(attributes.length,files.length);for(const line of attributes)assert(line.endsWith(": eol: lf"));
});
