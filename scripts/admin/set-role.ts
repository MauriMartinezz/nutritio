// Changes an existing user's role: pnpm admin:set-role <email> <ADMIN|NUTRITIONIST|CLIENT>
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { roleChange } from "./role-change";

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !role) {
    throw new Error("Usage: pnpm admin:set-role <email> <ADMIN|NUTRITIONIST|CLIENT>");
  }
  const data = roleChange(role);

  const { count } = await prisma.user.updateMany({
    where: { email: { equals: email, mode: "insensitive" } },
    data,
  });
  if (count === 0) throw new Error(`No user found with email ${email}`);

  console.log(`${email} is now ${data.role}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
