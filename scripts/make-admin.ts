// Promote an existing registered user to ADMIN (v1 has a single admin, no
// role UI — PRD assumption 1). Usage: npm run admin:promote -- owner@mail.com
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run admin:promote -- <email>");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) {
    console.error(`No user with email ${email} — register through /register first.`);
    process.exit(1);
  }
  if (user.role === "ADMIN") {
    console.log(`${email} is already an admin.`);
    return;
  }
  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`${email} is now an admin. Log out and back in to refresh the session token.`);
}

main().finally(() => prisma.$disconnect());
