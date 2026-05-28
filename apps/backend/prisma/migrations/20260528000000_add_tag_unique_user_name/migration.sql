-- AlterTable: add createdAt and updatedAt to tags
ALTER TABLE "tags"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: unique constraint on (userId, name)
CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");
