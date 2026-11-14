import Link from "next/link";
import { getCurrentUser } from "@/modules/identity/dal";
import { getClientHome, type ClientHomeLink } from "@/modules/checkins/dal";
import { describeCheckInStatus } from "@/modules/checkins/rules";
import { WeightChart } from "@/modules/checkins/components/weight-chart";
import { formatKg, formatWeightChange, weightChange } from "@/modules/checkins/weight-chart";
import { accessDaysLeft, describeAccess } from "../access-summary";

const primaryButton =
  "self-start rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700";

/**
 * Client dashboard for the home page. Reads the session, so render it inside
 * <Suspense>. Renders nothing for signed-out visitors and other roles.
 */
export async function ClientHome() {
  const user = await getCurrentUser();
  if (user?.role !== "CLIENT") return null;

  const { now, links } = await getClientHome();

  if (links.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Your follow-up</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You are not working with a nutritionist yet.
        </p>
        <Link href="/nutritionists" className={primaryButton}>
          Find a nutritionist
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Your follow-up</h2>
      {links.map((link) => (
        <LinkCard key={link.linkId} link={link} now={now} />
      ))}
    </section>
  );
}

function LinkCard({ link, now }: { link: ClientHomeLink; now: Date }) {
  const daysLeft = accessDaysLeft(link.accessUntil, now);
  const change = weightChange(link.weightSeries);

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="font-semibold">{link.nutritionistName}</h3>

      <p className={link.accessExpired ? "text-sm font-medium text-red-600 dark:text-red-400" : "text-sm"}>
        {describeAccess({ expired: link.accessExpired, daysLeft }, link.nutritionistName)}
        {!link.accessExpired && link.accessUntil && ` (until ${link.accessUntil.toLocaleDateString()})`}
      </p>

      {!link.accessExpired && (
        <div className="flex flex-col gap-2">
          <p
            className={
              link.state === "DUE"
                ? "text-sm font-medium text-amber-600 dark:text-amber-400"
                : "text-sm text-zinc-600 dark:text-zinc-400"
            }
          >
            {describeCheckInStatus(link)}
            {link.due && link.state === "UPCOMING" && ` (${link.due.toLocaleDateString()})`}
          </p>
          {link.state === "DUE" && (
            <Link href="/check-ins" className={primaryButton}>
              Send check-in
            </Link>
          )}
        </div>
      )}

      {link.latestWeightKg !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            Latest weight: <span className="font-medium">{formatKg(link.latestWeightKg)}</span>
            {change !== null &&
              ` · ${formatWeightChange(change)} since ${link.weightSeries[0].date.toLocaleDateString()}`}
          </p>
          <WeightChart series={link.weightSeries} />
        </div>
      )}
    </article>
  );
}
