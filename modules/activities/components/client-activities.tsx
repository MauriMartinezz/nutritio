import { getClientActivities } from "../dal";
import { ActivityList } from "./activity-list";
import { ActivitySummary } from "./activity-summary";

/** A client's activities, for a nutritionist with an accepted link. Render inside <Suspense>. */
export async function ClientActivities({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const { summary, activities } = await getClientActivities(clientId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Activity</h2>
      <ActivitySummary summary={summary} />
      <h3 className="text-sm font-semibold">Last 30 days</h3>
      <ActivityList activities={activities} />
    </section>
  );
}
