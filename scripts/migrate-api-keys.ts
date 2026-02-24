/**
 * One-time migration script to hash existing plaintext API keys.
 * Run: npx tsx scripts/migrate-api-keys.ts
 */
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

async function main() {
  // Find all API keys that still have a plaintext key
  const keys = await prisma.apiKey.findMany({
    where: { key: { not: null } },
    select: { id: true, key: true },
  });

  console.log(`Found ${keys.length} API key(s) with plaintext keys to migrate.`);

  let migrated = 0;
  for (const k of keys) {
    if (!k.key) continue;

    await prisma.apiKey.update({
      where: { id: k.id },
      data: {
        hashedKey: hashApiKey(k.key),
        keyPrefix: k.key.substring(0, 7),
        key: null,
      },
    });
    migrated++;
  }

  console.log(`Migrated ${migrated} API key(s). Plaintext keys have been cleared.`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
