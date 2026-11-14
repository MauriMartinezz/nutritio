import { activeClientsLabel } from "../directory";
import type { DirectoryNutritionist } from "../directory-dal";

/** Specialty and active clients, e.g. "Sports nutrition · 12 active clients". */
export function NutritionistFacts({ nutritionist }: { nutritionist: DirectoryNutritionist }) {
  return (
    <p className="text-sm text-secondary">
      {nutritionist.specialty && <span className="font-medium text-ink">{nutritionist.specialty} · </span>}
      {activeClientsLabel(nutritionist.activeClients)}
    </p>
  );
}

export function FeeBox({ fee }: { fee: string }) {
  return (
    <p className="rounded-card bg-surface-muted px-3 py-2 text-sm">
      <span className="font-medium">Fee:</span> <span className="font-mono font-semibold">{fee}</span>
    </p>
  );
}
