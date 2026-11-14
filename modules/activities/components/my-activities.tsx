import { getOwnActivities } from "../dal";
import { toDateInputValue } from "../rules";
import { ActivityForm } from "./activity-form";
import { ActivityList } from "./activity-list";
import { ActivitySummary } from "./activity-summary";
import { card, h2 } from "@/modules/ui/classes";

/** The signed-in client's activity log. Render inside <Suspense>. */
export async function MyActivities() {
  const { now, summary, activities } = await getOwnActivities();
  const earliest = new Date(now);
  earliest.setFullYear(earliest.getFullYear() - 1);

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <ActivityForm today={toDateInputValue(now)} earliest={toDateInputValue(earliest)} />
      </div>
      <ActivitySummary summary={summary} />
      <section className={card}>
        <h2 className={h2}>Last 30 days</h2>
        <ActivityList activities={activities} deletable />
      </section>
    </div>
  );
}
