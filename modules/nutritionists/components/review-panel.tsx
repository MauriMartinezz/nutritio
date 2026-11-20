import Link from "next/link";
import type { ReactNode } from "react";
import { formatDateTime } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { badge, eyebrow, figure, h2, h3, muted } from "@/modules/ui/classes";
import { CloseOnEscape } from "@/modules/ui/components/close-on-escape";
import { formatBirthDate, formatDni } from "../profile";
import { formatPrice } from "../public-profile";
import { nutritionistMessages, nutritionistStatusLabels } from "../messages";
import { STATUS_TONES } from "./status";
import { ReviewForm } from "./review-form";

function ageOn(birthDate: Date, today: Date) {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function Field({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-secondary">{term}</dt>
      <dd className="text-sm break-words">{children ?? <span className="text-tertiary">—</span>}</dd>
    </div>
  );
}

/**
 * Side panel with the full verification request. URL-driven (?review=id), so
 * it works without JavaScript. Rendered by the admin-only NutritionistList.
 */
export async function ReviewPanel({ id, closeHref }: { id: string; closeHref: string }) {
  const [locale, t, statusLabels] = await Promise.all([
    getLocale(),
    getMessages(nutritionistMessages),
    getMessages(nutritionistStatusLabels),
  ]);
  const nutritionist = await prisma.user.findFirst({
    where: { id, role: "NUTRITIONIST" },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      nutritionistStatus: true,
      dni: true,
      licenseNumber: true,
      birthDate: true,
      phone: true,
      specialty: true,
      bio: true,
      education: true,
      planIncludes: true,
      feeAmount: true,
      feeCurrency: true,
      feeDescription: true,
      createdAt: true,
      reviewedAt: true,
      verificationNote: true,
    },
  });
  if (!nutritionist) return null;

  const status = nutritionist.nutritionistStatus ?? "PENDING";
  const hasPublicProfile = nutritionist.bio || nutritionist.education || nutritionist.planIncludes || nutritionist.feeAmount;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <CloseOnEscape href={closeHref} />
      <Link href={closeHref} scroll={false} aria-label={t.closeReview} className="absolute inset-0 bg-black/40" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-surface"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4 md:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <p className={eyebrow}>{t.verificationRequest}</p>
            <h2 id="review-title" className={`${h2} flex flex-wrap items-center gap-2`}>
              {nutritionist.name} <span className={badge(STATUS_TONES[status])}>{statusLabels[status]}</span>
            </h2>
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-xl text-secondary hover:bg-surface-muted hover:text-ink"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">{t.close}</span>
          </Link>
        </header>

        <section className="flex flex-col gap-4 px-5 py-6 md:px-6">
          <h3 className={h3}>{t.application}</h3>
          <dl className="grid grid-cols-2 gap-4">
            <Field term={t.email}>
              {nutritionist.email}
              <span className="block text-xs text-tertiary">{nutritionist.emailVerified ? t.emailVerified : t.emailNotVerified}</span>
            </Field>
            <Field term={t.phone}>{nutritionist.phone}</Field>
            <Field term={t.dni}>{nutritionist.dni && <span className={figure}>{formatDni(nutritionist.dni)}</span>}</Field>
            <Field term={t.licenseNumber}>
              {nutritionist.licenseNumber && <span className={figure}>{nutritionist.licenseNumber}</span>}
            </Field>
            <Field term={t.birthDate}>
              {nutritionist.birthDate &&
                `${formatBirthDate(nutritionist.birthDate)} (${t.ageAtSignUp(ageOn(nutritionist.birthDate, nutritionist.createdAt))})`}
            </Field>
            <Field term={t.specialty}>{nutritionist.specialty}</Field>
            <Field term={t.appliedOn}>{formatDateTime(nutritionist.createdAt, locale)}</Field>
            <Field term={t.lastDecision}>
              {nutritionist.reviewedAt && formatDateTime(nutritionist.reviewedAt, locale)}
            </Field>
          </dl>
        </section>

        <section className="flex flex-col gap-4 border-t border-divider px-5 py-6 md:px-6">
          <h3 className={h3}>{t.publicProfile}</h3>
          {!hasPublicProfile ? (
            <p className={muted}>{t.notFilledIn}</p>
          ) : (
            <dl className="flex flex-col gap-4">
              <Field term={t.about}>{nutritionist.bio && <span className="whitespace-pre-line">{nutritionist.bio}</span>}</Field>
              <Field term={t.education}>{nutritionist.education}</Field>
              <Field term={t.planIncludes}>
                {nutritionist.planIncludes && <span className="whitespace-pre-line">{nutritionist.planIncludes}</span>}
              </Field>
              <Field term={t.fee}>
                {nutritionist.feeAmount && (
                  <>
                    <span className={figure}>
                      {formatPrice(nutritionist.feeAmount, nutritionist.feeCurrency)}
                    </span>
                    {nutritionist.feeDescription && ` · ${nutritionist.feeDescription}`}
                  </>
                )}
              </Field>
            </dl>
          )}
        </section>

        <div className="flex flex-1 flex-col border-t border-divider pt-6">
          <ReviewForm
            key={nutritionist.id}
            nutritionist={{
              id: nutritionist.id,
              name: nutritionist.name,
              email: nutritionist.email,
              note: nutritionist.verificationNote,
              dni: nutritionist.dni,
              licenseNumber: nutritionist.licenseNumber,
              birthDate: nutritionist.birthDate ? formatBirthDate(nutritionist.birthDate) : null,
              phone: nutritionist.phone,
              specialty: nutritionist.specialty,
            }}
          />
        </div>
      </aside>
    </div>
  );
}
