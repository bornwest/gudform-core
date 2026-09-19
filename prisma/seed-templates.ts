/**
 * Seed script to populate the marketplace with the 20 default templates.
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- npx tsx prisma/seed-templates.ts
 *
 * The script is idempotent — re-running it will upsert (update or create)
 * each template by slug.
 */

import { Prisma, PrismaClient, TemplateStatus } from "@prisma/client";

import { DEFAULT_TEMPLATES } from "../config/default-templates";

const prisma = new PrismaClient();

async function main() {
  // We need an admin/system user to own the official templates.
  // Find the first admin user, or fall back to the first user.
  let systemUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
  });

  if (!systemUser) {
    systemUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true },
    });
  }

  if (!systemUser) {
    console.error("No users found in the database. Create a user first.");
    process.exit(1);
  }

  console.log(
    `Using ${systemUser.name || systemUser.email} (${systemUser.id}) as template author.\n`,
  );

  for (const template of DEFAULT_TEMPLATES) {
    const data = {
      name: template.name,
      description: template.description,
      longDescription: template.longDescription,
      icon: template.icon,
      category: template.category as any,
      status: "PUBLISHED" as TemplateStatus,
      authorId: systemUser.id,
      authorName: "GudForm",
      authorEmail: "templates@gudform.com",
      formData: template.formData as unknown as Prisma.InputJsonValue,
      pricingType: "FREE" as const,
      isOfficial: true,
    };

    const result = await prisma.formTemplate.upsert({
      where: { slug: template.slug },
      create: { slug: template.slug, ...data },
      update: data,
    });

    console.log(`  ✓ ${result.name} (${result.slug})`);
  }

  console.log(`\nSeeded ${DEFAULT_TEMPLATES.length} templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
