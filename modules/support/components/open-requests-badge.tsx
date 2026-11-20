import { getMessages } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { supportMessages } from "../messages";

/** Count of open contact requests next to the admin's "Requests" link; hidden when zero. */
export async function OpenRequestsBadge() {
  await requireRole("ADMIN");
  const [count, t] = await Promise.all([
    prisma.supportRequest.count({ where: { status: "OPEN" } }),
    getMessages(supportMessages),
  ]);
  if (count === 0) return null;
  return (
    <span
      role="status"
      aria-label={t.openRequests(count)}
      title={t.openRequests(count)}
      className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 font-mono text-xs font-bold leading-5 text-zinc-900"
    >
      {count}
    </span>
  );
}
