import { getClientPreferencesForNutritionist } from "@/modules/clients/dal";
import { describePreferences } from "@/modules/clients/preferences";
import { badge, card, h1, h2, muted } from "@/modules/ui/classes";
import { getClientProfile } from "../dal";

/** Guarded by an accepted link. Render inside <Suspense>. */
export async function ClientProfile({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const client = await getClientProfile(clientId);
  const preferences = await getClientPreferencesForNutritionist(clientId);
  const labels = preferences ? describePreferences(preferences) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <div className="flex flex-col gap-1.5">
          <h1 className={h1}>{client.name}</h1>
          <p className={`${muted} break-all`}>{client.email}</p>
          {client.workingSince && (
            <p className={muted}>
              Working together since {client.workingSince.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <section className={card}>
        <h2 className={h2}>Preferences &amp; health</h2>
        {!preferences ? (
          <p className={muted}>No preferences yet.</p>
        ) : (
          <>
            {labels.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <li key={label} className={`${badge("neutral")} px-2.5 py-1 text-ink`}>
                    {label}
                  </li>
                ))}
              </ul>
            )}
            {preferences.otherConditions && (
              <p className="text-sm">
                <span className="font-medium">Other conditions:</span> {preferences.otherConditions}
              </p>
            )}
            {preferences.notes && (
              <p className="whitespace-pre-line text-sm">
                <span className="font-medium">Notes:</span> {preferences.notes}
              </p>
            )}
            {labels.length === 0 && !preferences.otherConditions && !preferences.notes && (
              <p className={muted}>No preferences yet.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
