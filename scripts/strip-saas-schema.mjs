/**
 * Strip hosted SaaS Prisma models from a schema string.
 * Used when exporting core to the public OSS repo.
 */

export const SAAS_ENUMS = [
  "DeveloperStatus",
  "IntegrationCategory",
  "IntegrationPricingType",
  "IntegrationStatus",
];

export const SAAS_MODELS = [
  "Subscription",
  "StripeConnectAccount",
  "DeveloperProfile",
  "Integration",
  "IntegrationInstall",
];

const USER_SAAS_RELATIONS = [
  /^\s*subscription\s+Subscription\??\s*$/gm,
  /^\s*stripeConnectAccount\s+StripeConnectAccount\??\s*$/gm,
  /^\s*integrations\s+Integration\[\]\s*$/gm,
  /^\s*integrationInstalls\s+IntegrationInstall\[\]\s*$/gm,
  /^\s*developerProfile\s+DeveloperProfile\??\s*$/gm,
];

function findBlockRange(schema, kind, name) {
  const header = new RegExp(`${kind}\\s+${name}\\s*\\{`);
  const match = header.exec(schema);
  if (!match) return null;

  let start = match.index;
  const before = schema.slice(0, start);
  const lineStart = before.lastIndexOf("\n") + 1;
  const prefix = schema.slice(lineStart, start);
  if (/^\s*$/.test(prefix)) start = lineStart;

  let commentStart = start;
  while (commentStart > 0) {
    const prevNl = schema.lastIndexOf("\n", commentStart - 2);
    const line = schema.slice(prevNl + 1, commentStart);
    if (/^\s*(\/\/|\/\/\/)/.test(line) || /^\s*$/.test(line)) {
      commentStart = prevNl + 1;
      if (prevNl < 0) {
        commentStart = 0;
        break;
      }
      continue;
    }
    break;
  }

  let i = match.index + match[0].length;
  let depth = 1;
  while (i < schema.length && depth > 0) {
    const ch = schema[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  if (schema[i] === "\n") i += 1;
  return { start: commentStart, end: i };
}

function removeBlock(schema, kind, name) {
  const range = findBlockRange(schema, kind, name);
  if (!range) return schema;
  return schema.slice(0, range.start) + schema.slice(range.end);
}

export function stripSaasSchema(source) {
  let schema = source;
  for (const name of SAAS_ENUMS) {
    schema = removeBlock(schema, "enum", name);
  }
  for (const name of SAAS_MODELS) {
    schema = removeBlock(schema, "model", name);
  }
  for (const re of USER_SAAS_RELATIONS) {
    schema = schema.replace(re, "");
  }
  schema = schema.replace(/\n{3,}/g, "\n\n");
  return schema.trim() + "\n";
}

export function assertCoreSchema(schema) {
  for (const name of [...SAAS_ENUMS, ...SAAS_MODELS]) {
    if (new RegExp(`\\b${name}\\b`).test(schema)) {
      throw new Error(`SaaS Prisma symbol still present after strip: ${name}`);
    }
  }
  for (const keep of ["User", "Form", "Team", "TeamInvite", "FormTemplate", "ApiKey"]) {
    if (!new RegExp(`model\\s+${keep}\\s*\\{`).test(schema)) {
      throw new Error(`Expected core model missing after strip: ${keep}`);
    }
  }
}
