import Link from "next/link";
import { getMessages } from "@/lib/i18n/server";
import { uiMessages } from "../messages";

export type BreadcrumbItem = { label: string; href?: string };

const crumbLink = "font-medium text-secondary underline-offset-2 hover:text-ink hover:underline";

/**
 * Where the current page sits: every item but the last links up the trail, the last is the page itself.
 * Below `sm` only a back link to the parent shows, so the trail never wraps or scrolls on a phone.
 */
export async function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  const t = await getMessages(uiMessages);
  const parent = items
    .slice(0, -1)
    .reverse()
    .find((item) => item.href);

  return (
    <nav aria-label={t.breadcrumbs} className="text-sm text-secondary">
      {parent?.href && (
        <Link href={parent.href} className={`${crumbLink} -my-3 flex min-h-11 min-w-0 max-w-full items-center sm:hidden`}>
          <span aria-hidden="true" className="mr-1.5 shrink-0">
            ←
          </span>
          <span className="truncate">{parent.label}</span>
        </Link>
      )}
      <ol className="hidden flex-wrap items-center gap-x-2 gap-y-1 sm:flex">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-2">
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "break-words text-ink" : "break-words"}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className={`${crumbLink} break-words`}>
                  {item.label}
                </Link>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
