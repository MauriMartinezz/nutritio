import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/negotiate";
import { getPendingActionCount } from "../dal";
import { pendingActionsLabel } from "../rules";

/** Yellow "N" badge: things the nutritionist must act on. Hidden when there are none. */
export function PendingActionsBadge({ count, locale = "en" }: { count: number; locale?: Locale }) {
  if (count <= 0) return null;
  const label = pendingActionsLabel(count, locale);
  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 font-mono text-xs font-bold leading-5 text-zinc-900"
    >
      {count}
    </span>
  );
}

/** Loads the signed-in nutritionist's count. Reads the session: render inside <Suspense>. */
export async function PendingActions() {
  const [count, locale] = await Promise.all([getPendingActionCount(), getLocale()]);
  return <PendingActionsBadge count={count} locale={locale} />;
}
