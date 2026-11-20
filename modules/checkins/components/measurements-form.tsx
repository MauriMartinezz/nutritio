import { getLocale } from "@/lib/i18n/server";
import { buttonSecondary, fieldHint } from "@/modules/ui/classes";
import { FlashNotice, SubmitButton } from "@/modules/ui/components/action-feedback";
import { setRequestedMeasurement } from "../actions";
import { checkInLabels, clientCheckInMessages } from "../messages";
import { MEASUREMENTS, type MeasurementSite } from "../rules";

const chip =
  "inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-accent-tint px-3 text-sm font-medium text-ink hover:border-accent";

/**
 * The nutritionist adds body measurements to the client's check-ins one by
 * one, from a fixed list, and can remove them. Plain form buttons: works without JS.
 */
export async function MeasurementsForm({ clientId, measurements }: { clientId: string; measurements: MeasurementSite[] }) {
  const locale = await getLocale();
  const t = clientCheckInMessages[locale];
  const names = checkInLabels[locale].measurements;
  const available = (Object.keys(MEASUREMENTS) as MeasurementSite[]).filter((site) => !measurements.includes(site));

  return (
    <form action={setRequestedMeasurement.bind(null, clientId)} className="flex flex-col gap-2">
      <p className="text-sm">
        {t.measurements}{" "}
        <span className="font-medium">{measurements.length === 0 ? t.notAsked : t.measurementsAsked}</span>
      </p>
      {measurements.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t.askedMeasurements}>
          {measurements.map((site) => (
            <li key={site}>
              <SubmitButton
                name="remove"
                value={site}
                pendingText={t.saving}
                className={chip}
                aria-label={t.stopAskingSite(names[site])}
              >
                {names[site]}
                <span aria-hidden className="text-secondary">
                  ×
                </span>
              </SubmitButton>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 && (
        <>
          <p className={fieldHint}>{t.addMeasurement}</p>
          <ul className="flex flex-wrap gap-2" aria-label={t.measurementsToAdd}>
            {available.map((site) => (
              <li key={site}>
                <SubmitButton name="add" value={site} pendingText={t.saving} className={buttonSecondary}>
                  + {names[site]}
                </SubmitButton>
              </li>
            ))}
          </ul>
        </>
      )}
      <FlashNotice />
    </form>
  );
}
