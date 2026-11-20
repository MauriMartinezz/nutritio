import { connection } from "next/server";
import { formatDate } from "../dates";
import { getLocale } from "@/lib/i18n/server";
import { badge, buttonSecondary, card, figure, h2, muted } from "@/modules/ui/classes";
import { effectiveAccessUntil } from "../access";
import Link from "next/link";
import { setAutoRenew } from "../actions";
import { getClientAccess } from "../dal";
import { rosterStatus, timeLeftLabel } from "../roster";
import { coachingLabels, coachingMessages } from "../messages";
import { STATUS_TONES } from "./my-clients";
import { PeriodFields } from "./period-fields";
import { RenewDialog } from "./roster-dialogs";
import { SubmitButton } from "./submit-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Access status, quick renew and auto-renew settings. Renewing opens a dialog
 * on this same page (?renew=<linkId>) and comes back here. Render inside <Suspense>.
 */
export async function ClientAccess({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: SearchParams;
}) {
  const { clientId } = await params;
  const query = (await searchParams) ?? {};
  const link = await getClientAccess(clientId);
  const locale = await getLocale();
  const t = coachingMessages[locale];
  await connection();
  const now = new Date();
  const access = { ...link, amount: link.accessAmount, unit: link.accessUnit };
  const period = { amount: link.accessAmount, unit: link.accessUnit };
  const until = effectiveAccessUntil(access, now);
  const status = rosterStatus(access, now);
  const pageHref = `/clients/${encodeURIComponent(clientId)}`;
  const renewing = query.renew === link.id;

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={h2}>{t.access}</h2>
        <span className={badge(STATUS_TONES[status])}>{coachingLabels[locale].statuses[status]}</span>
      </div>
      <p className="text-sm">
        <span className="font-medium">{timeLeftLabel(until, now, locale)}</span>
        {until && (
          <span className={muted}>
            {t.untilDate}
            <span className={figure}>{formatDate(until, locale)}</span>
          </span>
        )}
      </p>
      <Link href={`${pageHref}?renew=${encodeURIComponent(link.id)}`} scroll={false} className={`${buttonSecondary} self-start`}>
        {t.renewAccessLink}
      </Link>
      <form
        action={setAutoRenew.bind(null, link.id)}
        className="group flex flex-wrap items-center gap-2 border-t border-divider pt-4"
      >
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="autoRenew" defaultChecked={link.autoRenew} className="size-4 accent-accent" />
          {t.autoRenewCheckbox}
        </label>
        {/* The period only matters while auto-renew is on: CSS shows it then, with or without JavaScript. */}
        <span className="hidden flex-wrap items-center gap-2 text-sm group-has-[[name=autoRenew]:checked]:flex">
          {t.every}
          <PeriodFields defaultValue={period} label={t.autoRenew} required={false} />
        </span>
        <SubmitButton className={buttonSecondary}>{t.save}</SubmitButton>
      </form>
      {renewing && (
        <RenewDialog
          row={{ id: link.id, linkStatus: link.status, access, period, until, client: link.client }}
          closeHref={pageHref}
          now={now}
          fields={<input type="hidden" name="returnTo" value="client" />}
        />
      )}
    </section>
  );
}
