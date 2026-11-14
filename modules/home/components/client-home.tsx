import Link from "next/link";
import { getCurrentUser } from "@/modules/identity/dal";
import { getClientHome, type ClientHomeLink } from "@/modules/checkins/dal";
import { describeCheckInStatus } from "@/modules/checkins/rules";
import { WeightChart } from "@/modules/checkins/components/weight-chart";
import { formatKg, formatWeightChange, weightChange } from "@/modules/checkins/weight-chart";
import { buttonPrimary, callout, card, eyebrow, h2, kpi, muted } from "@/modules/ui/classes";
import { accessDaysLeft, describeAccess } from "../access-summary";

const primaryButton = `${buttonPrimary} self-start`;

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
      <section className={card}>
        <h2 className={h2}>Your follow-up</h2>
        <p className={muted}>
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
      <h2 className={h2}>Your follow-up</h2>
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
    <article className={card}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight">{link.nutritionistName}</h3>
        <p className={link.accessExpired ? `${callout("danger")} font-medium` : muted}>
          {describeAccess({ expired: link.accessExpired, daysLeft }, link.nutritionistName)}
          {!link.accessExpired && link.accessUntil && ` (until ${link.accessUntil.toLocaleDateString()})`}
        </p>
      </div>

      {!link.accessExpired && (
        <div
          className={
            link.state === "DUE"
              ? `${callout("warning")} flex flex-wrap items-center justify-between gap-3`
              : "flex flex-col gap-2"
          }
        >
          <p className={link.state === "DUE" ? "font-medium" : muted}>
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
        <div className="flex flex-col gap-4 border-t border-divider pt-4">
          {/* Flex drops the {" "} nodes visually, but they keep the text "Latest weight: 71.5 kg · …". */}
          <p className={`${eyebrow} flex flex-wrap items-baseline gap-x-3 gap-y-2`}>
            <span className="basis-full">Latest weight:</span>{" "}
            <span className={`${kpi} text-ink`}>{formatKg(link.latestWeightKg)}</span>
            {change !== null && (
              <span className="font-normal">
                {" · "}
                <span className="font-mono font-semibold tabular-nums text-ink">{formatWeightChange(change)}</span>
                {` since ${link.weightSeries[0].date.toLocaleDateString()}`}
              </span>
            )}
          </p>
          <WeightChart series={link.weightSeries} />
        </div>
      )}
    </article>
  );
}
