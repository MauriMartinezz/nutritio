import { getLocale, getMessages } from "@/lib/i18n/server";
import { activeClientsLabel } from "../directory";
import type { DirectoryNutritionist } from "../directory-dal";
import { coachingMessages } from "../messages";

/** Specialty and active clients, e.g. "Sports nutrition · 12 active clients". */
export async function NutritionistFacts({ nutritionist }: { nutritionist: DirectoryNutritionist }) {
  const locale = await getLocale();
  return (
    <p className="text-sm text-secondary">
      {nutritionist.specialty && <span className="font-medium text-ink">{nutritionist.specialty} · </span>}
      {activeClientsLabel(nutritionist.activeClients, locale)}
    </p>
  );
}

export async function FeeBox({ fee }: { fee: string }) {
  const t = await getMessages(coachingMessages);
  return (
    <p className="rounded-card bg-surface-muted px-3 py-2 text-sm">
      <span className="font-medium">{t.fee}</span> <span className="font-mono font-semibold">{fee}</span>
    </p>
  );
}
