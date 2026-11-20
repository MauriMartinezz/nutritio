import Link from "next/link";
import { formatNumber } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";
import { buttonLink, card, figure, link } from "@/modules/ui/classes";
import type { CheckInView } from "../dal";
import { formatCheckInDate } from "../format";
import { checkInLabels, checkInMessages } from "../messages";
import { weightStepChanges } from "../progress";
import { formatKg, formatWeightChange } from "../weight-chart";

// On phones each row stacks as label/value pairs (the label comes from data-label).
const cell =
  "flex items-center justify-between gap-3 before:text-xs before:font-medium before:text-secondary before:content-[attr(data-label)] md:table-cell md:px-3 md:py-3 md:align-middle md:whitespace-nowrap md:before:content-none";

/** The client's check-ins with one nutritionist, newest first; each opens its detail. */
export function CheckInTable({ checkIns, locale }: { checkIns: CheckInView[]; locale: Locale }) {
  const t = checkInMessages[locale];
  const labels = checkInLabels[locale];
  const steps = weightStepChanges(checkIns);

  return (
    <div className={card}>
      <table className="block w-full text-sm md:table">
        <caption className="sr-only">{t.historyCaption}</caption>
        <thead className="hidden border-b border-line text-left text-xs text-secondary md:table-header-group">
          <tr>
            {[t.date, t.weight, t.change, t.dietFollowed, t.workouts].map((heading) => (
              <th key={heading} scope="col" className="px-3 pb-3 font-medium first:pl-0">
                {heading}
              </th>
            ))}
            <th scope="col" className="pb-3 pl-3 text-right font-medium">
              <span className="sr-only">{t.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="block divide-y divide-divider md:table-row-group">
          {checkIns.map((checkIn, index) => {
            const date = formatCheckInDate(checkIn.createdAt, locale);
            const href = `/check-ins/${checkIn.id}`;
            const step = steps[index];
            return (
              <tr key={checkIn.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:table-row">
                <th scope="row" className="text-left font-normal md:table-cell md:py-3 md:pr-3">
                  <Link href={href} className={`${link} font-mono font-semibold tabular-nums`}>
                    {date}
                  </Link>
                </th>
                <td data-label={t.weight} className={cell}>
                  <span className={figure}>{formatKg(checkIn.weightKg, locale)}</span>
                </td>
                <td data-label={t.change} className={cell}>
                  {step === null ? (
                    <span className="text-tertiary">—</span>
                  ) : (
                    <span className="font-mono tabular-nums text-secondary">{formatWeightChange(step, locale)}</span>
                  )}
                </td>
                <td data-label={t.dietFollowed} className={cell}>
                  {checkIn.dietAdherence === null ? (
                    <span className="text-tertiary">—</span>
                  ) : (
                    <span className="font-mono tabular-nums">{formatNumber(checkIn.dietAdherence, locale)}%</span>
                  )}
                </td>
                <td data-label={t.workouts} className={cell}>
                  {checkIn.completedWorkouts ? labels.yes : labels.no}
                </td>
                <td className="flex justify-end md:table-cell md:py-3 md:pl-3 md:text-right">
                  <Link href={href} className={buttonLink} aria-label={t.viewCheckIn(date)}>
                    {t.view} →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
