-- CreateEnum
CREATE TYPE "DeveloperStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "developer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT,
    "website_url" TEXT NOT NULL,
    "github_url" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "agreed_to_terms" BOOLEAN NOT NULL DEFAULT false,
    "status" "DeveloperStatus" NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,

    CONSTRAINT "developer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "developer_profiles_user_id_key" ON "developer_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "developer_profiles" ADD CONSTRAINT "developer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add new fields to integrations
ALTER TABLE "integrations" ADD COLUMN "github_repo_url" TEXT;
ALTER TABLE "integrations" ADD COLUMN "docs_url" TEXT;
ALTER TABLE "integrations" ADD COLUMN "privacy_policy_url" TEXT;
ALTER TABLE "integrations" ADD COLUMN "webhook_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "integrations" ADD COLUMN "webhook_verified_at" TIMESTAMP(3);
ALTER TABLE "integrations" ADD COLUMN "rejection_reason" TEXT;
