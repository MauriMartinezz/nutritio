// Loading placeholders shaped like the content they stand in for.
// Server-safe markup (no hooks); the pulse is skipped when reduced motion is preferred.

import { card } from "@/modules/ui/classes";
import { LoadingLabel } from "./loading-label";

const block = "rounded-badge bg-surface-muted motion-safe:animate-pulse";

/** One grey bar; size it with Tailwind classes (e.g. "h-4 w-32"). */
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div aria-hidden className={`${block} ${className}`} />;
}

/** Wraps placeholders so screen readers hear one "Loading" instead of empty shapes. */
function Loading({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <LoadingLabel />
      {children}
    </div>
  );
}

function Row() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

/** A card holding a list of rows: activities, check-ins, meetings, plans… */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Loading className={`${card} divide-y divide-divider`}>
      {Array.from({ length: rows }, (_, index) => (
        <Row key={index} />
      ))}
    </Loading>
  );
}

/** A table with a header row: clients, nutritionists to review. */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  return (
    <Loading className={`${card} gap-0 p-0`}>
      <div className="grid gap-4 border-b border-divider px-4 py-3" style={grid}>
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3 w-2/3" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid gap-4 border-b border-divider px-4 py-4 last:border-b-0" style={grid}>
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className={column === 0 ? "h-4 w-4/5" : "h-4 w-1/2"} />
          ))}
        </div>
      ))}
    </Loading>
  );
}

function CardBlock() {
  return (
    <div className={card}>
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="mt-2 h-9 w-28" />
    </div>
  );
}

/** A grid of cards: the nutritionist directory, home dashboards. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Loading className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <CardBlock key={index} />
      ))}
    </Loading>
  );
}

/** Titled sections with label + field pairs: profile, plan editor, detail pages. */
export function SectionsSkeleton({ sections = 3, fields = 2 }: { sections?: number; fields?: number }) {
  return (
    <Loading className="flex flex-col gap-8">
      {Array.from({ length: sections }, (_, section) => (
        <div key={section} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40" />
          <div className={card}>
            {Array.from({ length: fields }, (_, field) => (
              <div key={field} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Loading>
  );
}
