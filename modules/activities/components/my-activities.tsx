import { getMessages } from "@/lib/i18n/server";
import { card, h2, muted } from "@/modules/ui/classes";
import { Dialog } from "@/modules/ui/components/dialog";
import { getOwnActivityLog } from "../dal";
import { activityMessages } from "../messages";
import { toDateInputValue } from "../rules";
import { ActivityDashboard } from "./activity-dashboard";
import { ActivityForm } from "./activity-form";
import { ActivityHistory } from "./activity-history";

/** Where the "Log activity" dialog opens and closes. */
export const LOG_ACTIVITY_HREF = "/activities?log=1";
const CLOSE_HREF = "/activities";

/**
 * The signed-in client's dashboard and history; `?log=1` opens the log form in
 * a dialog. Render inside <Suspense>.
 */
export async function MyActivities({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ now, dashboard, activities }, { log }, t] = await Promise.all([
    getOwnActivityLog(),
    searchParams,
    getMessages(activityMessages),
  ]);
  const earliest = new Date(now);
  earliest.setFullYear(earliest.getFullYear() - 1);

  return (
    <div className="flex flex-col gap-6">
      <ActivityDashboard dashboard={dashboard} />
      <section className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={h2}>{t.history}</h2>
          <p className={muted}>{t.historyHint}</p>
        </div>
        <ActivityHistory activities={activities} />
      </section>
      {log === "1" && (
        <Dialog title={t.logTitle} closeHref={CLOSE_HREF}>
          <ActivityForm today={toDateInputValue(now)} earliest={toDateInputValue(earliest)} doneHref={CLOSE_HREF} />
        </Dialog>
      )}
    </div>
  );
}
