-- AlterTable: Add soft-delete to questions
ALTER TABLE "questions" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateTable: FormVersion for immutable schema snapshots
CREATE TABLE "form_versions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "is_breaking" BOOLEAN NOT NULL DEFAULT false,
    "changes_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_versions_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add formVersionId to responses
ALTER TABLE "form_responses" ADD COLUMN "form_version_id" TEXT;

-- CreateIndex
CREATE INDEX "questions_formId_deletedAt_idx" ON "questions"("formId", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "form_versions_form_id_version_number_key" ON "form_versions"("form_id", "version_number");

-- CreateIndex
CREATE INDEX "form_versions_form_id_idx" ON "form_versions"("form_id");

-- CreateIndex
CREATE INDEX "form_responses_form_version_id_idx" ON "form_responses"("form_version_id");

-- AddForeignKey
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_version_id_fkey" FOREIGN KEY ("form_version_id") REFERENCES "form_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey: Remove CASCADE delete from answers->questions
ALTER TABLE "answers" DROP CONSTRAINT "answers_questionId_fkey";

-- AddForeignKey: Re-add with RESTRICT to prevent answer deletion
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
