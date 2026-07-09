import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Matches whatever seed.ts actually used to create the user — a hardcoded fallback
// here would silently no-op for anyone who set a custom SEED_ADMIN_EMAIL (which the
// modern-cms installer always prompts for).
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const { count } = await prisma.user.deleteMany({ where: { email } });
  if (count === 0) {
    console.log(`No user found for ${email} — nothing to delete.`);
  } else {
    console.log(`Deleted existing admin user: ${email}`);
  }
  console.log('Run "npm run db:seed" (from the repo root) to recreate it with the current SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD in .env.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
