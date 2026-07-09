-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'AUTHOR';

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "translationOfId" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SavedBlock" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "SiteTheme" ADD COLUMN     "analyticsCustomScript" TEXT,
ADD COLUMN     "analyticsId" TEXT,
ADD COLUMN     "analyticsProvider" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "backgroundColorDark" TEXT,
ADD COLUMN     "darkModeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primaryColorDark" TEXT,
ADD COLUMN     "textColorDark" TEXT;

-- CreateTable
CREATE TABLE "PageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "thumbnail" TEXT,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_translationOfId_fkey" FOREIGN KEY ("translationOfId") REFERENCES "CollectionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedBlock" ADD CONSTRAINT "SavedBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
