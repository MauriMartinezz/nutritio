import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { MeetingRequestsSection } from "@/modules/meetings/components/meeting-requests-section";
import {
  badge,
  buttonPrimary,
  buttonSecondary,
  callout,
  card,
  figure,
  h2,
  link,
  list,
  muted,
  type Tone,
} from "@/modules/ui/classes";
import { DEFAULT_PERIOD, accessState, effectiveAccessUntil, type AccessState } from "../access";
import { acceptClientRequest, rejectClientRequest, renewClientAccess, setAutoRenew } from "../actions";
import { PeriodFields, formatPeriod } from "./period-fields";

const SECTIONS: { state: AccessState; title: string; empty: string; tone: Tone }[] = [
  { state: "EXPIRING", title: "Expiring soon (7 days)", empty: "No access expires this week.", tone: "warning" },
  { state: "EXPIRED", title: "Expired", empty: "No expired clients.", tone: "danger" },
  { state: "ACTIVE", title: "Active", empty: "No active clients.", tone: "success" },
];

/** A nutritionist's requests and client access dashboard. Render inside <Suspense>. */
export async function MyClients() {
  const nutritionist = await requireRole("NUTRITIONIST");

  if (nutritionist.nutritionistStatus !== "APPROVED") {
    return (
      <p className={callout("warning")}>
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
    <div className="flex flex-col gap-6">
      <section className={card}>
        <h2 className={h2}>Requests</h2>
        {pending.length === 0 ? (
          <p className={muted}>No pending requests.</p>
        ) : (
          <ul className={list}>
            {pending.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-semibold">{link.client.name}</p>
                  <p className={`${muted} break-all`}>{link.client.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    action={acceptClientRequest.bind(null, link.id)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className={muted}>Access for</span>
                    <PeriodFields defaultValue={DEFAULT_PERIOD} label="Access" />
                    <button className={buttonPrimary}>Accept</button>
                  </form>
                  <form action={rejectClientRequest.bind(null, link.id)}>
                    <button className={buttonSecondary}>Decline</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MeetingRequestsSection />

      {clients.length === 0 ? (
        <section className={card}>
          <h2 className={h2}>Clients</h2>
          <p className={muted}>You have no clients yet.</p>
        </section>
      ) : (
        SECTIONS.map((section) => {
          const rows = clients.filter((client) => client.state === section.state);
          return (
            <section key={section.state} className={card}>
              <h2 className={`${h2} flex flex-wrap items-center gap-2`}>
                {section.title}{" "}
                <span className={`${badge(rows.length > 0 ? section.tone : "neutral")} font-mono`}>
                  ({rows.length})
                </span>
              </h2>
              {rows.length === 0 ? (
                <p className={muted}>{section.empty}</p>
              ) : (
                <ul className={list}>
                  {rows.map((client) => (
                    <li key={client.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/clients/${client.client.id}`} className={`${link} font-semibold`}>
                          {client.client.name}
                        </Link>
                        <span className="flex flex-wrap items-center gap-2 text-sm text-secondary">
                          <span className={badge(section.tone)}>
                            {client.state === "EXPIRED" ? "Expired" : "Access until"}{" "}
                            <span className={figure}>{client.until?.toLocaleDateString() ?? "—"}</span>
                          </span>
                          {client.autoRenew && ` · auto-renews every ${formatPeriod(client.period)}`}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <form
                          action={renewClientAccess.bind(null, client.id)}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <PeriodFields defaultValue={client.period} label={`Renew ${client.client.name}`} />
                          <button className={buttonSecondary}>Renew</button>
                        </form>
                        <form
                          action={setAutoRenew.bind(null, client.id)}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <label className="flex min-h-11 items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="autoRenew"
                              defaultChecked={client.autoRenew}
                              className="size-4 accent-accent"
                            />
                            Auto-renew every
                          </label>
                          <PeriodFields defaultValue={client.period} label={`Auto-renew ${client.client.name}`} />
                          <button className={buttonSecondary}>Save</button>
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
