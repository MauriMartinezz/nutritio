// One contact request with its status and the admin's answer.
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";
import { badge, callout } from "@/modules/ui/classes";
import type { SupportRequestView } from "../dal";
import type { supportMessages } from "../messages";

type Text = (typeof supportMessages)["en"];

export function StatusBadge({ status, t }: { status: "OPEN" | "RESOLVED"; t: Text }) {
  return <span className={badge(status === "OPEN" ? "warning" : "success")}>{status === "OPEN" ? t.open : t.resolved}</span>;
}

export function RequestCard({
  request,
  t,
  locale,
  children,
}: {
  request: SupportRequestView;
  t: Text;
  locale: Locale;
  children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 py-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{request.title}</h3>
        <StatusBadge status={request.status} t={t} />
      </header>
      <p className="text-sm whitespace-pre-line text-secondary">{request.description}</p>
      <p className="text-xs text-tertiary">
        {t.sentOn(formatDateTime(request.createdAt, locale))}
        {request.resolvedAt && ` · ${t.resolvedOn(formatDateTime(request.resolvedAt, locale))}`}
      </p>
      {request.reply ? (
        <div className={`${callout("accent")} flex flex-col gap-1`}>
          <p className="font-semibold">{t.adminReply}</p>
          <p className="whitespace-pre-line">{request.reply}</p>
        </div>
      ) : (
        <p className="text-sm text-secondary">{t.awaitingReply}</p>
      )}
      {children}
    </article>
  );
}
