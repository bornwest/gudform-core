/**
 * One-time rewrite of saved S3 bucket URLs to app URLs.
 *
 * S3 uploads used to be saved as direct bucket URLs
 * (`https://<bucket>.s3.<region>.amazonaws.com/<key>`, or `S3_PUBLIC_URL/<key>`),
 * which stop working once the bucket is private. New uploads are saved as
 * `<NEXT_PUBLIC_APP_URL>/api/files/<key>`, which redirects to a short-lived
 * signed URL. This script rewrites the old URLs to the new form wherever they
 * were saved: answers, questions (welcome and choice images), draft questions,
 * published form versions, templates and file upload records.
 *
 * Usage (counts matches only; add --apply to write):
 *   npx tsx --env-file=.env scripts/rewrite-s3-file-urls.ts [--apply]
 *
 * Reads DATABASE_URL, NEXT_PUBLIC_APP_URL, S3_BUCKET_NAME, S3_REGION and, if
 * set, S3_PUBLIC_URL. Safe to run more than once.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function need(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

const trimSlashes = (url: string) => url.replace(/\/+$/, "");

const bucket = need("S3_BUCKET_NAME");
const region = need("S3_REGION");
const oldPrefix = `${trimSlashes(
  process.env.S3_PUBLIC_URL || `https://${bucket}.s3.${region}.amazonaws.com`,
)}/`;
const newPrefix = `${trimSlashes(need("NEXT_PUBLIC_APP_URL"))}/api/files/`;
const apply = process.argv.includes("--apply");

/** Table and column, and whether the column is jsonb (true) or text. */
const TARGETS: Array<{ table: string; column: string; json: boolean }> = [
  { table: "answers", column: "value", json: false },
  { table: "answers", column: "fileUrl", json: false },
  { table: "file_uploads", column: "url", json: false },
  { table: "questions", column: "properties", json: true },
  { table: "forms", column: "draft_questions", json: true },
  { table: "form_versions", column: "snapshot", json: true },
  { table: "form_templates", column: "form_data", json: true },
];

async function main() {
  console.log(`Rewriting ${oldPrefix}<key> -> ${newPrefix}<key>`);
  if (!apply) console.log("Dry run: pass --apply to write changes.\n");

  let total = 0;
  for (const { table, column, json } of TARGETS) {
    // Identifiers come from the fixed list above; values are parameters.
    const text = json ? `"${column}"::text` : `"${column}"`;
    const where = `"${column}" IS NOT NULL AND strpos(${text}, $1) > 0`;

    const [{ count }] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*) AS count FROM "${table}" WHERE ${where}`,
      oldPrefix,
    );
    const rows = Number(count);
    total += rows;
    console.log(`${table}.${column}: ${rows} row(s)`);

    if (apply && rows > 0) {
      const replaced = `replace(${text}, $1, $2)`;
      await prisma.$executeRawUnsafe(
        `UPDATE "${table}" SET "${column}" = ${json ? `${replaced}::jsonb` : replaced} WHERE ${where}`,
        oldPrefix,
        newPrefix,
      );
    }
  }

  console.log(
    `\n${total} row(s) ${apply ? "rewritten" : "would be rewritten"}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
