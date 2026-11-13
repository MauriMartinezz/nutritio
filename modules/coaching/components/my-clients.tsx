import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { acceptClientRequest, rejectClientRequest } from "../actions";

/** A nutritionist's pending requests and current clients. Render inside <Suspense>. */
export async function MyClients() {
  const nutritionist = await requireRole("NUTRITIONIST");

  if (nutritionist.nutritionistStatus !== "APPROVED") {
    return (
      <p className="text-sm text-zinc-500">
        Clients can find you once an admin verifies your profile.
      </p>
    );
  }

  const links = await prisma.nutritionistClient.findMany({
    where: { nutritionistId: nutritionist.id, status: { in: ["PENDING", "ACCEPTED"] } },
    select: { id: true, status: true, client: { select: { id: true, name: true, email: true } } },
    orderBy: { requestedAt: "asc" },
  });
  const pending = links.filter((link) => link.status === "PENDING");
  const accepted = links.filter((link) => link.status === "ACCEPTED");

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Requests</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">No pending requests.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {pending.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{link.client.name}</p>
                  <p className="text-sm text-zinc-500">{link.client.email}</p>
                </div>
                <div className="flex gap-2">
                  <form action={acceptClientRequest.bind(null, link.id)}>
                    <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                      Accept
                    </button>
                  </form>
                  <form action={rejectClientRequest.bind(null, link.id)}>
                    <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Clients</h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-zinc-500">You have no clients yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {accepted.map((link) => (
              <li key={link.id}>
                <Link href={`/clients/${link.client.id}`} className="underline">
                  {link.client.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
