-- AlterTable
ALTER TABLE "form_responses" ADD COLUMN "resume_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "form_responses_resume_token_key" ON "form_responses"("resume_token");
