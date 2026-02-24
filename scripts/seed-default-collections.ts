/**
 * One-time migration script: Create default collections for existing users
 * and assign all their forms to those collections.
 *
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-default-collections.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Finding users without collections...");

  // Get all users who don't have any collection yet
  const usersWithoutCollections = await prisma.user.findMany({
    where: {
      collections: { none: {} },
    },
    select: { id: true, email: true },
  });

  console.log(
    `Found ${usersWithoutCollections.length} user(s) without collections.`,
  );

  let created = 0;
  let formsAssigned = 0;

  for (const user of usersWithoutCollections) {
    // Create default collection
    const collection = await prisma.collection.create({
      data: {
        name: "Default",
        userId: user.id,
        isDefault: true,
      },
    });

    created++;

    // Assign all user's forms to this collection
    const result = await prisma.form.updateMany({
      where: {
        userId: user.id,
        collectionId: null,
      },
      data: {
        collectionId: collection.id,
      },
    });

    formsAssigned += result.count;

    console.log(
      `  ✅ User ${user.email || user.id}: created default collection, assigned ${result.count} form(s)`,
    );
  }

  console.log(`\n🎉 Done! Created ${created} collection(s), assigned ${formsAssigned} form(s).`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
