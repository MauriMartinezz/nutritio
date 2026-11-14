import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { NUTRITIONIST_STATUSES, type NutritionistStatus } from "@/modules/identity/roles";
import {
  badge,
  buttonPrimary,
  buttonSecondary,
  card,
  input,
  list,
  muted,
  type Tone,
} from "@/modules/ui/classes";
import { setNutritionistStatus } from "../actions";

const TABS = [
  { label: "Pending", status: "PENDING" },
  { label: "Verified", status: "APPROVED" },
  { label: "Rejected", status: "REJECTED" },
  { label: "All", status: "ALL" },
] as const;

const STATUS_TONES: Record<NutritionistStatus, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "neutral",
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
      <nav className="flex flex-wrap gap-2 text-sm font-semibold">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={{ pathname: "/admin", query: { status: tab.status, ...(query && { q: query }) } }}
            aria-current={status === tab.status ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 ${
              status === tab.status
                ? "bg-ink text-bg"
                : "border border-line-strong bg-surface text-ink hover:bg-surface-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <form className="flex flex-col gap-2 sm:flex-row" action="/admin">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, DNI or license"
          className={`${input} w-full`}
        />
        <button className={buttonSecondary}>Search</button>
      </form>

      {nutritionists.length === 0 ? (
        <p className={`${card} ${muted}`}>No nutritionists found.</p>
      ) : (
        <ul className={`${list} rounded-card-lg border border-line bg-surface px-5 md:px-6`}>
          {nutritionists.map((nutritionist) => {
            const current = nutritionist.nutritionistStatus ?? "PENDING";
            return (
              <li key={nutritionist.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {nutritionist.name}
                    <span className={badge(STATUS_TONES[current])}>
                      {current.toLowerCase()}
                    </span>
                  </p>
                  <p className={`${muted} break-all`}>{nutritionist.email}</p>
                  <p className={muted}>
                    DNI {nutritionist.dni ?? "—"} · License {nutritionist.licenseNumber ?? "—"}
                    {nutritionist.specialty && ` · ${nutritionist.specialty}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS[current].map((action) => (
                    <form key={action.to} action={setNutritionistStatus.bind(null, nutritionist.id, action.to)}>
                      <button
                        className={action.to === "APPROVED" ? buttonPrimary : buttonSecondary}
                      >
                        {action.label}
                      </button>
                    </form>
                  ))}
                  <Link
                    href={`/admin/nutritionists/${nutritionist.id}`}
                    className={buttonSecondary}
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
