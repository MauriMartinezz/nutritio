import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/i18n/format";
import { getLocale } from "@/lib/i18n/server";
import { navMessages } from "@/modules/identity/nav-messages";
import { card, eyebrow, figure, h1, h3, list } from "@/modules/ui/classes";
import { Breadcrumbs } from "@/modules/ui/components/breadcrumbs";
import { getOwnCheckIn } from "../dal";
import { asQuestion, formatCheckInDateLong } from "../format";
import { formatCm } from "../measurement-chart";
import { checkInLabels, checkInMessages } from "../messages";
import { RATINGS, type RatingField } from "../rules";
import { formatKg, formatWeightChange } from "../weight-chart";
import { round2 } from "../trend";

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-secondary">{term}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** Everything one check-in of the signed-in client recorded (404 if it isn't theirs). Render inside <Suspense>. */
export async function CheckInDetail({ params }: { params: Promise<{ checkInId: string }> }) {
  const { checkInId } = await params;
  const [checkIn, locale] = await Promise.all([getOwnCheckIn(checkInId), getLocale()]);
  if (!checkIn) notFound();
  const t = checkInMessages[locale];
  const labels = checkInLabels[locale];
  const yesNo = (value: boolean) => (value ? labels.yes : labels.no);
  const step = checkIn.previousWeightKg === null ? null : round2(checkIn.weightKg - checkIn.previousWeightKg);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: navMessages[locale].checkIns, href: "/check-ins" },
          { label: formatCheckInDateLong(checkIn.createdAt, locale) },
        ]}
      />
      <header className="flex flex-col gap-1">
        <p className={eyebrow}>{t.sentTo(checkIn.nutritionistName)}</p>
        <h1 className={h1}>{formatCheckInDateLong(checkIn.createdAt, locale)}</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="body" className={card}>
          <h2 id="body" className={h3}>
            {t.bodyTitle}
          </h2>
          <dl className={list}>
            <Row term={t.weight}>
              <span className={figure}>{formatKg(checkIn.weightKg, locale)}</span>
              {step !== null && (
                <span className="block text-xs text-secondary">{t.vsPrevious(formatWeightChange(step, locale))}</span>
              )}
            </Row>
            {checkIn.measurements.map((m) => (
              <Row key={m.site} term={labels.measurements[m.site]}>
                <span className={figure}>{formatCm(m.cm, locale)}</span>
              </Row>
            ))}
          </dl>
        </section>

        <section aria-labelledby="week" className={card}>
          <h2 id="week" className={h3}>
            {t.weekTitle}
          </h2>
          <dl className={list}>
            <Row term={t.dietFollowed}>
              {checkIn.dietAdherence === null ? (
                <span className="text-tertiary">{t.notAnswered}</span>
              ) : (
                <span className={figure}>{formatNumber(checkIn.dietAdherence, locale)}%</span>
              )}
            </Row>
            <Row term={asQuestion(labels.completedWorkouts, locale)}>{yesNo(checkIn.completedWorkouts)}</Row>
            <Row term={t.gymPerformance}>
              {checkIn.gymPerformance ? (
                labels.gymPerformance[checkIn.gymPerformance]
              ) : (
                <span className="text-tertiary">{t.notAnswered}</span>
              )}
            </Row>
            {(Object.keys(RATINGS) as RatingField[]).map((field) => (
              <Row key={field} term={labels.ratings[field]}>
                <span className={figure}>{checkIn[field]}</span>
                <span className="text-secondary">/5</span>
              </Row>
            ))}
            {checkIn.menstruating !== null && (
              <Row term={labels.cycleHistory}>{yesNo(checkIn.menstruating)}</Row>
            )}
            <Row term={t.discomfort}>
              {checkIn.discomfort ? checkIn.discomfortNotes ?? labels.yes : labels.no}
            </Row>
          </dl>
        </section>
      </div>

      {checkIn.notes && (
        <section aria-labelledby="notes" className={card}>
          <h2 id="notes" className={h3}>
            {t.notes}
          </h2>
          <p className="whitespace-pre-line text-sm">{checkIn.notes}</p>
        </section>
      )}
    </>
  );
}
