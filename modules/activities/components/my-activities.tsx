import { getOwnActivities } from "../dal";
import { toDateInputValue } from "../rules";
import { ActivityForm } from "./activity-form";
import { ActivityList } from "./activity-list";
import { ActivitySummary } from "./activity-summary";

/** The signed-in client's activity log. Render inside <Suspense>. */
export async function MyActivities() {
  const { now, summary, activities } = await getOwnActivities();
  const earliest = new Date(now);
  earliest.setFullYear(earliest.getFullYear() - 1);

  return (
    <div className="flex flex-col gap-8">
      <ActivityForm today={toDateInputValue(now)} earliest={toDateInputValue(earliest)} />
      <ActivitySummary summary={summary} />
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Last 30 days</h2>
        <ActivityList activities={activities} deletable />
      </section>
    </div>
  );
}
