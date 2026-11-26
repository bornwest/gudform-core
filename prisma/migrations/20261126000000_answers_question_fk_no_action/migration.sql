-- Deleting a form (or a user) cascades to both its questions and its responses.
-- RESTRICT is checked row by row, so it failed whenever questions were removed
-- before their answers. NO ACTION is checked at the end of the statement: it
-- still blocks deleting a question that has answers, but lets the cascade finish.

-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_questionId_fkey";

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
