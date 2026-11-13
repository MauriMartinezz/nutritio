import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { approveNutritionist, rejectNutritionist } from "../actions";

/** Admin-only list. Reads the session, so render it inside <Suspense>. */
export async function PendingNutritionists() {
  await requireRole("ADMIN");

  const pending = await prisma.user.findMany({
    where: { role: "NUTRITIONIST", nutritionistStatus: "PENDING" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    return <p className="text-sm text-zinc-500">No nutritionists waiting for verification.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
      {pending.map((nutritionist) => (
        <li key={nutritionist.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
          <div>
            <p className="font-medium">{nutritionist.name}</p>
            <p className="text-sm text-zinc-500">
              {nutritionist.email} · registered {nutritionist.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <form action={approveNutritionist.bind(null, nutritionist.id)}>
              <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                Approve
              </button>
            </form>
            <form action={rejectNutritionist.bind(null, nutritionist.id)}>
              <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
                Reject
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
