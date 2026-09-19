#!/usr/bin/env node
/**
 * Copy this private product tree into a core-only directory for
 * gudlab/gudform-core. Does not git-push.
 *
 * Usage: node scripts/oss-export.mjs [dest-dir]
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  cpSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertCoreSchema, stripSaasSchema } from "./strip-saas-schema.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(process.argv[2] || join(root, "dist-oss"));
const excludeFile = join(root, "scripts/oss-exclude.txt");

mkdirSync(dest, { recursive: true });

const rsync = spawnSync(
  "rsync",
  [
    "-a",
    "--delete",
    "--exclude-from",
    excludeFile,
    `${root}/`,
    `${dest}/`,
  ],
  { stdio: "inherit" },
);

if (rsync.error) {
  console.error(rsync.error);
  process.exit(1);
}

if (rsync.status !== 0) {
  process.exit(rsync.status ?? 1);
}

for (const name of [".env", ".env.local", ".env.loc", ".env.production"]) {
  const p = join(dest, name);
  if (existsSync(p)) rmSync(p);
}

const schemaPath = join(dest, "prisma/schema.prisma");
const stripped = stripSaasSchema(readFileSync(schemaPath, "utf8"));
assertCoreSchema(stripped);
writeFileSync(schemaPath, stripped);

const stubDelivery = join(dest, "lib/integration-delivery.ts");
writeFileSync(
  stubDelivery,
  `/** Marketplace delivery is hosted-only and is not part of this core export. */
export async function deliverToIntegrations(
  _formId?: string,
  _userId?: string,
  _responseId?: string,
  _formTitle?: string,
  _answers?: unknown,
) {}
`,
);

mkdirSync(join(dest, ".github/workflows"), { recursive: true });
cpSync(join(root, "scripts/oss-ci.yml"), join(dest, ".github/workflows/ci.yml"));

assertNoSecrets(dest);

console.log(`OSS export written to ${dest}`);

function assertNoSecrets(dir) {
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const name of readdirSync(current)) {
      if (name === ".git") continue;
      const p = join(current, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        stack.push(p);
        continue;
      }
      const secretEnv =
        name === ".env" ||
        name === ".env.local" ||
        name === ".env.loc" ||
        (name.startsWith(".env") && name !== ".env.example");
      if (secretEnv || name.endsWith(".pem")) {
        throw new Error(
          `secret file survived OSS export: ${relative(dest, p)}`,
        );
      }
    }
  }
}
