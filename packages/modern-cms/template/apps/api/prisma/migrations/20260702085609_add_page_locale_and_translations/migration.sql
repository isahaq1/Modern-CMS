-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "translationOfId" TEXT;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_translationOfId_fkey" FOREIGN KEY ("translationOfId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
