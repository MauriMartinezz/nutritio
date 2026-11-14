import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { MeetingRequestsSection } from "@/modules/meetings/components/meeting-requests-section";
import { DEFAULT_PERIOD, accessState, effectiveAccessUntil, type AccessState } from "../access";
import { acceptClientRequest, rejectClientRequest, renewClientAccess, setAutoRenew } from "../actions";
import { PeriodFields, formatPeriod } from "./period-fields";

const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

const SECTIONS: { state: AccessState; title: string; empty: string }[] = [
  { state: "EXPIRING", title: "Expiring soon (7 days)", empty: "No access expires this week." },
  { state: "EXPIRED", title: "Expired", empty: "No expired clients." },
  { state: "ACTIVE", title: "Active", empty: "No active clients." },
];

/** A nutritionist's requests and client access dashboard. Render inside <Suspense>. */
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
    select: {
      id: true,
      status: true,
      accessAmount: true,
      accessUnit: true,
      accessUntil: true,
      autoRenew: true,
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: { requestedAt: "asc" },
  });
  await connection();
  const now = new Date();

  const pending = links.filter((link) => link.status === "PENDING");
  const clients = links
    .filter((link) => link.status === "ACCEPTED")
    .map((link) => {
      const access = { ...link, amount: link.accessAmount, unit: link.accessUnit };
      return {
        ...link,
        period: { amount: link.accessAmount, unit: link.accessUnit },
        until: effectiveAccessUntil(access, now),
        state: accessState(access, now),
      };
    })
    .sort((a, b) => (a.until?.getTime() ?? 0) - (b.until?.getTime() ?? 0));

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
                <div className="flex flex-wrap items-center gap-2">
                  <form action={acceptClientRequest.bind(null, link.id)} className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Access for</span>
                    <PeriodFields defaultValue={DEFAULT_PERIOD} label="Access" />
                    <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                      Accept
                    </button>
                  </form>
                  <form action={rejectClientRequest.bind(null, link.id)}>
                    <button className={button}>Decline</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MeetingRequestsSection />

      {clients.length === 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Clients</h2>
          <p className="text-sm text-zinc-500">You have no clients yet.</p>
        </section>
      ) : (
        SECTIONS.map((section) => {
          const rows = clients.filter((client) => client.state === section.state);
          return (
            <section key={section.state} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">
                {section.title} <span className="text-zinc-500">({rows.length})</span>
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-zinc-500">{section.empty}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                  {rows.map((client) => (
                    <li key={client.id} className="flex flex-col gap-2 py-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link href={`/clients/${client.client.id}`} className="font-medium underline">
                          {client.client.name}
                        </Link>
                        <span className="text-sm text-zinc-500">
                          {client.state === "EXPIRED" ? "Expired" : "Access until"}{" "}
                          {client.until?.toLocaleDateString() ?? "—"}
                          {client.autoRenew && ` · auto-renews every ${formatPeriod(client.period)}`}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <form action={renewClientAccess.bind(null, client.id)} className="flex items-center gap-2">
                          <PeriodFields defaultValue={client.period} label={`Renew ${client.client.name}`} />
                          <button className={button}>Renew</button>
                        </form>
                        <form action={setAutoRenew.bind(null, client.id)} className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-sm">
                            <input type="checkbox" name="autoRenew" defaultChecked={client.autoRenew} />
                            Auto-renew every
                          </label>
                          <PeriodFields defaultValue={client.period} label={`Auto-renew ${client.client.name}`} />
                          <button className={button}>Save</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
