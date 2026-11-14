import { getClientActivities } from "../dal";
import { ActivityList } from "./activity-list";
import { ActivitySummary } from "./activity-summary";
import { card, h2, h3 } from "@/modules/ui/classes";

/** A client's activities, for a nutritionist with an accepted link. Render inside <Suspense>. */
export async function ClientActivities({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const { summary, activities } = await getClientActivities(clientId);

  return (
    <section className={card}>
      <h2 className={h2}>Activity</h2>
      <ActivitySummary summary={summary} />
      <h3 className={h3}>Last 30 days</h3>
      <ActivityList activities={activities} />
    </section>
  );
}
