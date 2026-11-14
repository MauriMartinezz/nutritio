import { connection } from "next/server";
import { badge, buttonSecondary, card, figure, h2, muted } from "@/modules/ui/classes";
import { effectiveAccessUntil } from "../access";
import { renewClientAccess, setAutoRenew } from "../actions";
import { getClientAccess } from "../dal";
import { rosterStatus, timeLeftLabel } from "../roster";
import { STATUS_PILLS } from "./my-clients";
import { PeriodFields } from "./period-fields";
import { QuickPeriodForm } from "./quick-period-form";

/** Access status, quick renew and auto-renew settings. Render inside <Suspense>. */
export async function ClientAccess({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const link = await getClientAccess(clientId);
  await connection();
  const now = new Date();
  const access = { ...link, amount: link.accessAmount, unit: link.accessUnit };
  const period = { amount: link.accessAmount, unit: link.accessUnit };
  const until = effectiveAccessUntil(access, now);
  const pill = STATUS_PILLS[rosterStatus(access, now)];

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={h2}>Access</h2>
        <span className={badge(pill.tone)}>{pill.label}</span>
      </div>
      <p className="text-sm">
        <span className="font-medium">{timeLeftLabel(until, now)}</span>
        {until && (
          <span className={muted}>
            {" · until "}
            <span className={figure}>{until.toLocaleDateString()}</span>
          </span>
        )}
      </p>
      <QuickPeriodForm
        action={renewClientAccess.bind(null, link.id)}
        placeholder="Renew…"
        submitLabel="Renew"
        label="Renew access for"
        customDefault={period}
      />
      <form
        action={setAutoRenew.bind(null, link.id)}
        className="flex flex-wrap items-center gap-2 border-t border-divider pt-4"
      >
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="autoRenew" defaultChecked={link.autoRenew} className="size-4 accent-accent" />
          Auto-renew every
        </label>
        <PeriodFields defaultValue={period} label="Auto-renew" />
        <button className={buttonSecondary}>Save</button>
      </form>
    </section>
  );
}
