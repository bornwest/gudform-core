-- AlterTable: Add hashed_key and key_prefix columns, make key nullable
ALTER TABLE "api_keys" ADD COLUMN "hashed_key" TEXT;
ALTER TABLE "api_keys" ADD COLUMN "key_prefix" TEXT;

-- Backfill: Hash existing plaintext keys
UPDATE "api_keys"
SET "hashed_key" = encode(sha256(convert_to("key", 'UTF8')), 'hex'),
    "key_prefix" = substring("key" from 1 for 7)
WHERE "key" IS NOT NULL;

-- Now make columns required and add unique constraint
ALTER TABLE "api_keys" ALTER COLUMN "hashed_key" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "key_prefix" SET NOT NULL;
CREATE UNIQUE INDEX "api_keys_hashed_key_key" ON "api_keys"("hashed_key");

-- Make the old key column nullable
ALTER TABLE "api_keys" ALTER COLUMN "key" DROP NOT NULL;

-- Clear plaintext keys
UPDATE "api_keys" SET "key" = NULL WHERE "key" IS NOT NULL;
