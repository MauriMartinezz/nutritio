import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { buttonPrimary, callout, h2, h3, muted } from "@/modules/ui/classes";
import { Dialog } from "@/modules/ui/components/dialog";
import { getOwnCheckIns } from "../dal";
import { formatCheckInDate } from "../format";
import { checkInMessages } from "../messages";
import { describeCheckInStatus } from "../rules";
import { CheckInDashboard } from "./check-in-dashboard";
import { CheckInForm } from "./check-in-form";
import { CheckInTable } from "./check-in-table";

const PAGE = "/check-ins";

/** `?new=<linkId>` opens the check-in form for that nutritionist. */
export const newCheckInHref = (linkId: string) => `${PAGE}?new=${encodeURIComponent(linkId)}`;

/**
 * The signed-in client's check-ins, per nutritionist: progress dashboard,
 * history table and a button that opens the form in a dialog (driven by the
 * URL, so it works without JavaScript). Render inside <Suspense>.
 */
export async function MyCheckIns({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [links, locale, params] = await Promise.all([getOwnCheckIns(), getLocale(), searchParams]);
  const t = checkInMessages[locale];
  const openFor = typeof params.new === "string" ? params.new : null;

  if (links.length === 0) return <p className={muted}>{t.noActiveNutritionist}</p>;
  // Only one of the caller's own active links opens the form; anything else opens nothing.
  const opened = links.find((link) => link.linkId === openFor) ?? null;

  return (
    <div className="flex flex-col gap-10">
      {links.map(({ linkId, nutritionistName, checkIns, due, ...status }) => (
        <section key={linkId} aria-labelledby={`link-${linkId}`} className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h2 id={`link-${linkId}`} className={h2}>
                {nutritionistName}
              </h2>
              <p className={status.state === "DUE" ? `${callout("warning")} font-medium` : muted}>
                {describeCheckInStatus(status, locale)}
                {due && status.state === "UPCOMING" && ` · ${t.nextOn(formatCheckInDate(due, locale))}`}
              </p>
            </div>
            <Link href={newCheckInHref(linkId)} scroll={false} className={buttonPrimary}>
              + {t.newCheckIn}
            </Link>
          </div>

          <section aria-label={t.progress} className="flex flex-col gap-3">
            <h3 className={h3}>{t.progress}</h3>
            <CheckInDashboard checkIns={checkIns} locale={locale} />
          </section>

          {checkIns.length > 0 && (
            <section aria-label={t.history} className="flex flex-col gap-3">
              <h3 className={h3}>{t.history}</h3>
              <CheckInTable checkIns={checkIns} locale={locale} />
            </section>
          )}
        </section>
      ))}

      {opened && (
        <Dialog eyebrow={t.newCheckIn} title={opened.nutritionistName} closeHref={PAGE}>
          <CheckInForm
            linkId={opened.linkId}
            askCycle={opened.askCycle}
            measurements={opened.measurements}
            cancelHref={PAGE}
          />
        </Dialog>
      )}
    </div>
  );
}
