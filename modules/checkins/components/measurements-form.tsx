import { buttonSecondary, fieldHint } from "@/modules/ui/classes";
import { setRequestedMeasurement } from "../actions";
import { MEASUREMENTS, type MeasurementSite } from "../rules";

const chip =
  "inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-accent-tint px-3 text-sm font-medium text-ink hover:border-accent";

/**
 * The nutritionist adds body measurements to the client's check-ins one by
 * one, from a fixed list, and can remove them. Plain form buttons: works without JS.
 */
export function MeasurementsForm({ clientId, measurements }: { clientId: string; measurements: MeasurementSite[] }) {
  const available = (Object.keys(MEASUREMENTS) as MeasurementSite[]).filter((site) => !measurements.includes(site));

  return (
    <form action={setRequestedMeasurement.bind(null, clientId)} className="flex flex-col gap-2">
      <p className="text-sm">
        Measurements:{" "}
        <span className="font-medium">
          {measurements.length === 0 ? "not asked" : "asked in every check-in (cm)"}
        </span>
      </p>
      {measurements.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Asked measurements">
          {measurements.map((site) => (
            <li key={site}>
              <button name="remove" value={site} className={chip} aria-label={`Stop asking ${MEASUREMENTS[site]}`}>
                {MEASUREMENTS[site]}
                <span aria-hidden className="text-secondary">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 && (
        <>
          <p className={fieldHint}>Add a measurement:</p>
          <ul className="flex flex-wrap gap-2" aria-label="Measurements you can add">
            {available.map((site) => (
              <li key={site}>
                <button name="add" value={site} className={buttonSecondary}>
                  + {MEASUREMENTS[site]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </form>
  );
}
