import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { NUTRITIONIST_STATUSES, type NutritionistStatus } from "@/modules/identity/roles";
import { setNutritionistStatus } from "../actions";

const TABS = [
  { label: "Pending", status: "PENDING" },
  { label: "Verified", status: "APPROVED" },
  { label: "Rejected", status: "REJECTED" },
  { label: "All", status: "ALL" },
] as const;

const STATUS_BADGES: Record<NutritionistStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const QUICK_ACTIONS: Record<NutritionistStatus, { label: string; to: NutritionistStatus }[]> = {
  PENDING: [
    { label: "Approve", to: "APPROVED" },
    { label: "Reject", to: "REJECTED" },
  ],
  APPROVED: [{ label: "Revoke", to: "REJECTED" }],
  REJECTED: [{ label: "Approve", to: "APPROVED" }],
};

type SearchParams = Promise<{ status?: string; q?: string }>;

/** Admin-only list. Reads the session and search params, so render it inside <Suspense>. */
export async function NutritionistList({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const status = (NUTRITIONIST_STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as NutritionistStatus)
    : params.status === "ALL"
      ? "ALL"
      : "PENDING";
  const query = (params.q ?? "").trim().slice(0, 100);

  const where: Prisma.UserWhereInput = {
    role: "NUTRITIONIST",
    ...(status !== "ALL" && { nutritionistStatus: status }),
    ...(query && {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
        { dni: { contains: query } },
        { licenseNumber: { contains: query } },
      ],
    }),
  };

  const nutritionists = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      licenseNumber: true,
      specialty: true,
      nutritionistStatus: true,
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2 text-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={{ pathname: "/admin", query: { status: tab.status, ...(query && { q: query }) } }}
            aria-current={status === tab.status ? "page" : undefined}
            className={`rounded-full px-3 py-1 ${
              status === tab.status
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <form className="flex gap-2" action="/admin">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, DNI or license"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
          Search
        </button>
      </form>

      {nutritionists.length === 0 ? (
        <p className="text-sm text-zinc-500">No nutritionists found.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {nutritionists.map((nutritionist) => {
            const current = nutritionist.nutritionistStatus ?? "PENDING";
            return (
              <li key={nutritionist.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <p className="flex items-center gap-2 font-medium">
                    {nutritionist.name}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGES[current]}`}>
                      {current.toLowerCase()}
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500">{nutritionist.email}</p>
                  <p className="text-sm text-zinc-500">
                    DNI {nutritionist.dni ?? "—"} · License {nutritionist.licenseNumber ?? "—"}
                    {nutritionist.specialty && ` · ${nutritionist.specialty}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {QUICK_ACTIONS[current].map((action) => (
                    <form key={action.to} action={setNutritionistStatus.bind(null, nutritionist.id, action.to)}>
                      <button
                        className={
                          action.to === "APPROVED"
                            ? "rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                            : "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                        }
                      >
                        {action.label}
                      </button>
                    </form>
                  ))}
                  <Link
                    href={`/admin/nutritionists/${nutritionist.id}`}
                    className="rounded-md px-3 py-1.5 text-sm underline"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
