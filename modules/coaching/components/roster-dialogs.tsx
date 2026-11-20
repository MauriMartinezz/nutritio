import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate } from "../dates";
import { getLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { respondToMeeting } from "@/modules/meetings/actions";
import { MEETING_LIMITS, meetingKindLabel, toDateTimeLocalValue } from "@/modules/meetings/rules";
import { Dialog } from "@/modules/ui/components/dialog";
import { buttonDanger, buttonPrimary, buttonSecondary, figure, input, label, muted } from "@/modules/ui/classes";
import { addPeriod, renewAccess, type AccessPeriod, type LinkAccess } from "../access";
import { acceptClientRequest, rejectClientRequest, renewClientAccess } from "../actions";
import { coachingMessages } from "../messages";
import { PERIOD_PRESETS, rosterHref, type RosterDialog, type RosterFilter } from "../roster";
import { PeriodChoice } from "./period-choice";
import { SubmitButton } from "./submit-button";

/** What the dialogs need from a table row. */
export type DialogRow = {
  id: string;
  linkStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  access: LinkAccess;
  period: AccessPeriod;
  until: Date | null;
  client: { name: string };
};

function endDates(end: (period: AccessPeriod) => Date) {
  return Object.fromEntries(PERIOD_PRESETS.map((preset) => [preset.value, end(preset.period)]));
}

/** Cancel + confirm, aligned at the bottom of a dialog form. */
function Buttons({
  closeHref,
  confirm,
  cancel,
  danger,
}: {
  closeHref: string;
  confirm: string;
  cancel: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-divider pt-4">
      <Link href={closeHref} scroll={false} className={buttonSecondary}>
        {cancel}
      </Link>
      <SubmitButton className={danger ? buttonDanger : buttonPrimary}>{confirm}</SubmitButton>
    </div>
  );
}

/**
 * Renew access dialog, shared by the clients table and the client's page.
 * `fields` are hidden inputs telling the action where to return.
 */
export async function RenewDialog({
  row,
  closeHref,
  now,
  fields,
}: {
  row: DialogRow;
  closeHref: string;
  now: Date;
  fields: ReactNode;
}) {
  const locale = await getLocale();
  const t = coachingMessages[locale];
  return (
    <Dialog eyebrow={t.renewAccess} title={row.client.name} closeHref={closeHref}>
      <p className="text-sm">
        {row.until && row.until > now ? t.accessEndsOn : t.accessEndedOn}
        <span className={figure}>{row.until ? formatDate(row.until, locale) : "—"}</span>.{" "}
        <span className={muted}>{t.renewHint}</span>
      </p>
      <form action={renewClientAccess.bind(null, row.id)} className="flex flex-col gap-5">
        {fields}
        <PeriodChoice endDates={endDates((period) => renewAccess(row.access, period, now))} current={row.period} />
        <Buttons closeHref={closeHref} confirm={t.confirmRenewal} cancel={t.cancel} />
      </form>
    </Dialog>
  );
}

/**
 * The dialog named in the URL (renew, accept or answer a meeting). Rows and
 * the meeting request are the signed-in nutritionist's own; anything else
 * opens nothing.
 */
export async function RosterDialogs({
  dialog,
  rows,
  filter,
  nutritionistId,
  now,
}: {
  dialog: RosterDialog | null;
  rows: DialogRow[];
  filter: RosterFilter;
  nutritionistId: string;
  now: Date;
}) {
  if (!dialog) return null;
  const locale = await getLocale();
  const t = coachingMessages[locale];
  const closeHref = rosterHref(filter);
  const filterField = <input type="hidden" name="filter" value={filter} />;

  if (dialog.kind === "renew") {
    const row = rows.find((r) => r.id === dialog.id && r.linkStatus === "ACCEPTED");
    if (!row) return null;
    return <RenewDialog row={row} closeHref={closeHref} now={now} fields={filterField} />;
  }

  if (dialog.kind === "accept") {
    const row = rows.find((r) => r.id === dialog.id && r.linkStatus === "PENDING");
    if (!row) return null;
    return (
      <Dialog eyebrow={t.requestToWork} title={row.client.name} closeHref={closeHref}>
        <p className={muted}>{t.acceptHint}</p>
        <form action={acceptClientRequest.bind(null, row.id)} className="flex flex-col gap-5">
          {filterField}
          <PeriodChoice endDates={endDates((period) => addPeriod(now, period))} current={row.period} />
          <Buttons closeHref={closeHref} confirm={t.acceptClient} cancel={t.cancel} />
        </form>
        <form action={rejectClientRequest.bind(null, row.id)} className="flex items-center justify-between gap-3 text-sm">
          {filterField}
          <span className={muted}>{t.notAFit}</span>
          <SubmitButton className={buttonDanger}>{t.declineRequest}</SubmitButton>
        </form>
      </Dialog>
    );
  }

  const request = await prisma.meetingRequest.findFirst({
    where: { id: dialog.id, status: "PENDING", link: { nutritionistId } },
    select: {
      id: true,
      kind: true,
      message: true,
      preferredTimes: true,
      createdAt: true,
      link: { select: { client: { select: { name: true } } } },
    },
  });
  if (!request) return null;
  const respond = respondToMeeting.bind(null, request.id);

  return (
    <Dialog eyebrow={t.meetingRequest(meetingKindLabel(request.kind, locale))} title={request.link.client.name} closeHref={closeHref}>
      <div className="flex flex-col gap-2 text-sm">
        <p className={muted}>{t.requestedOn(formatDate(request.createdAt, locale))}</p>
        {request.preferredTimes && (
          <p>
            <span className="font-medium">{t.preferredTimes}</span> {request.preferredTimes}
          </p>
        )}
        {request.message && (
          <p className="whitespace-pre-line rounded-card bg-surface-muted px-3 py-2">{request.message}</p>
        )}
      </div>
      <form action={respond} className="flex flex-col gap-4">
        {filterField}
        <input type="hidden" name="decision" value="accept" />
        {/* datetime-local has no time zone: the server reads it in its local time. */}
        <label className={label}>
          {t.dateAndTime}
          <input
            type="datetime-local"
            name="scheduledFor"
            required
            min={toDateTimeLocalValue(now)}
            className={`${input} font-mono`}
          />
        </label>
        <label className={label}>
          {t.noteOptional}
          <input
            name="responseNote"
            maxLength={MEETING_LIMITS.responseNote}
            placeholder={t.notePlaceholder}
            className={input}
          />
        </label>
        <Buttons closeHref={closeHref} confirm={t.scheduleMeeting} cancel={t.cancel} />
      </form>
      <details className="group border-t border-divider pt-4 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium text-secondary hover:text-ink">
          {t.declineInstead}
        </summary>
        <form action={respond} className="flex flex-col gap-3 pt-2">
          {filterField}
          <input type="hidden" name="decision" value="decline" />
          <label className={label}>
            {t.reasonOptional}
            <input name="responseNote" maxLength={MEETING_LIMITS.responseNote} className={input} />
          </label>
          <SubmitButton className={`${buttonDanger} self-end`}>{t.declineMeeting}</SubmitButton>
        </form>
      </details>
    </Dialog>
  );
}
