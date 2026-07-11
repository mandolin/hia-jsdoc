export const HIA_JSDOC_CONFIG_SCHEMA_VERSION = "0.1.0-draft";
export const HIA_JSDOC_CONFIG_SCHEMA_ID = "https://mandolin.github.io/HIA-Documentation/schemas/hia-jsdoc-config-0.1.0-draft.schema.json";

const relativePath = {
  type: "string",
  minLength: 1,
  not: {
    anyOf: [
      { pattern: "^(?:[A-Za-z]:|/|\\\\|[A-Za-z][A-Za-z0-9+.-]*:)" },
      { pattern: "(?:^|[\\\\/])\\.\\.(?:[\\\\/]|$)" }
    ]
  }
};

export const HIA_JSDOC_CONFIG_JSON_SCHEMA = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: HIA_JSDOC_CONFIG_SCHEMA_ID,
  title: "HIA JSDoc Config",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "workspaceRoot", "outputDirectory", "inputs"],
  properties: {
    $schema: { const: HIA_JSDOC_CONFIG_SCHEMA_ID },
    schemaVersion: { const: HIA_JSDOC_CONFIG_SCHEMA_VERSION },
    workspaceRoot: relativePath,
    outputDirectory: relativePath,
    inputs: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "path"],
        properties: {
          kind: { enum: ["javascript-source", "javascript-module"] },
          path: relativePath
        }
      }
    },
    options: {
      type: "object",
      additionalProperties: true,
      properties: {
        mode: { enum: ["standalone", "hiaIntegration", "both"] },
        includePattern: { type: "string", minLength: 1 },
        excludePattern: { type: "string", minLength: 1 },
        recurse: { type: "boolean" },
        writeResultManifest: { type: "boolean" },
        sourcesContentPolicy: { enum: ["none", "reference", "embed"] },
        extraPlugins: { type: "object" },
        plugin: { type: "object" },
        hia: { type: "object" },
        theme: { type: "object" },
        baseConfig: { type: "object" }
      }
    },
    profileIds: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: { type: "string", pattern: "^[a-z0-9][a-z0-9._-]*$" }
    }
  }
});
