-- AlterTable
ALTER TABLE "Page" ADD COLUMN "noIndex" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Page" ADD COLUMN "previewToken" TEXT;

-- Backfill preview tokens for existing pages
UPDATE "Page" SET "previewToken" = 'prev_' || "id" WHERE "previewToken" IS NULL;

ALTER TABLE "Page" ALTER COLUMN "previewToken" SET NOT NULL;
CREATE UNIQUE INDEX "Page_previewToken_key" ON "Page"("previewToken");

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "CollectionItem" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "CollectionItem" ADD COLUMN "ogImage" TEXT;
ALTER TABLE "CollectionItem" ADD COLUMN "noIndex" BOOLEAN NOT NULL DEFAULT false;
