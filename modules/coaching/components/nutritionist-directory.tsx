import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { formatFee } from "@/modules/nutritionists/public-profile";
import { badge, buttonPrimary, card, h3, muted } from "@/modules/ui/classes";
import { requestNutritionist } from "../actions";

/** Approved nutritionists a client can work with. Render inside <Suspense>. */
export async function NutritionistDirectory() {
  const client = await requireRole("CLIENT");

  const nutritionists = await prisma.user.findMany({
    where: { role: "NUTRITIONIST", nutritionistStatus: "APPROVED" },
    select: {
      id: true,
      name: true,
      bio: true,
      education: true,
      planIncludes: true,
      feeAmount: true,
      feeCurrency: true,
      feeDescription: true,
      clientLinks: { where: { clientId: client.id }, select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  if (nutritionists.length === 0) {
    return <p className={muted}>There are no verified nutritionists yet.</p>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {nutritionists.map((nutritionist) => {
        const status = nutritionist.clientLinks[0]?.status;
        const request = requestNutritionist.bind(null, nutritionist.id);
        const fee = formatFee(nutritionist);

        return (
          <li key={nutritionist.id} className={`${card} justify-between`}>
            <div className="flex flex-col gap-3">
              <p className={h3}>{nutritionist.name}</p>
              {nutritionist.bio && (
                <p className="whitespace-pre-line text-sm text-ink">{nutritionist.bio}</p>
              )}
              {nutritionist.education && (
                <p className={muted}>
                  <span className="font-medium text-ink">Education:</span> {nutritionist.education}
                </p>
              )}
              {nutritionist.planIncludes && (
                <p className={`${muted} whitespace-pre-line`}>
                  <span className="font-medium text-ink">Plan includes:</span> {nutritionist.planIncludes}
                </p>
              )}
              {fee && (
                <p className="rounded-card bg-surface-muted px-3 py-2 text-sm">
                  <span className="font-medium">Fee:</span> <span className="font-mono font-semibold">{fee}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
              {status === "ACCEPTED" && <span className={badge("success")}>Working together</span>}
              {status === "PENDING" && <span className={badge("warning")}>Request sent</span>}
              {(status === undefined || status === "REJECTED") && (
                <form action={request} className="flex flex-wrap items-center gap-3">
                  {status === "REJECTED" && <span className={muted}>Previous request declined</span>}
                  <button className={buttonPrimary}>
                    {status === "REJECTED" ? "Request again" : "Request to work together"}
                  </button>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
