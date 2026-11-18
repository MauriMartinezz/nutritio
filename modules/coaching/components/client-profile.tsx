import { getClientProfile } from "../dal";

/** Guarded by an accepted link. Render inside <Suspense>. */
export async function ClientProfile({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const client = await getClientProfile(clientId);

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold">{client.name}</h1>
      <p className="text-sm text-zinc-500">{client.email}</p>
      {client.workingSince && (
        <p className="text-sm text-zinc-500">
          Working together since {client.workingSince.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
