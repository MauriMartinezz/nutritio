// Promotes an existing user to ADMIN: pnpm admin:promote <email>
import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: pnpm admin:promote <email>");

  const { count } = await prisma.user.updateMany({
    where: { email: { equals: email, mode: "insensitive" } },
    data: { role: "ADMIN", nutritionistStatus: null },
  });
  if (count === 0) throw new Error(`No user found with email ${email}`);

  console.log(`${email} is now an ADMIN`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
