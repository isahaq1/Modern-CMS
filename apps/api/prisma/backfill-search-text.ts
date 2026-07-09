// One-off: populates the new `searchText` column (added alongside the standard-CMS
// platform pass) for every Page/CollectionItem row that predates it. Going forward,
// pages.routes.ts/collections.routes.ts keep it in sync on every save — this only
// needs to run once, against existing data.
import { PrismaClient } from "@prisma/client";
import { extractSearchText, type PageNode } from "@pgcms/shared";

const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.page.findMany({ where: { searchText: "" } });
  for (const page of pages) {
    const searchText = extractSearchText(page.content as unknown as PageNode);
    await prisma.page.update({ where: { id: page.id }, data: { searchText } });
  }
  console.log(`Backfilled searchText for ${pages.length} page(s).`);

  const items = await prisma.collectionItem.findMany({ where: { searchText: "" } });
  for (const item of items) {
    const searchText = extractSearchText(item.content as unknown as PageNode);
    await prisma.collectionItem.update({ where: { id: item.id }, data: { searchText } });
  }
  console.log(`Backfilled searchText for ${items.length} collection item(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
