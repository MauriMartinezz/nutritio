import { getClientPreferencesForNutritionist } from "@/modules/clients/dal";
import { describePreferences } from "@/modules/clients/preferences";
import { getClientProfile } from "../dal";

/** Guarded by an accepted link. Render inside <Suspense>. */
export async function ClientProfile({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const client = await getClientProfile(clientId);
  const preferences = await getClientPreferencesForNutritionist(clientId);
  const labels = preferences ? describePreferences(preferences) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="text-sm text-zinc-500">{client.email}</p>
        {client.workingSince && (
          <p className="text-sm text-zinc-500">
            Working together since {client.workingSince.toLocaleDateString()}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Preferences &amp; health</h2>
        {!preferences ? (
          <p className="text-sm text-zinc-500">No preferences yet.</p>
        ) : (
          <>
            {labels.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <li
                    key={label}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800"
                  >
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
              <p className="text-sm text-zinc-500">No preferences yet.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
