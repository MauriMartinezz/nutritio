import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { formatFee } from "@/modules/nutritionists/public-profile";
import { requestNutritionist } from "../actions";

const primaryButton =
  "rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700";

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
    return <p className="text-sm text-zinc-500">There are no verified nutritionists yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
      {nutritionists.map((nutritionist) => {
        const status = nutritionist.clientLinks[0]?.status;
        const request = requestNutritionist.bind(null, nutritionist.id);
        const fee = formatFee(nutritionist);

        return (
          <li key={nutritionist.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="flex basis-full flex-col gap-1">
              <p className="font-medium">{nutritionist.name}</p>
              {nutritionist.bio && (
                <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                  {nutritionist.bio}
                </p>
              )}
              {nutritionist.education && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Education:</span> {nutritionist.education}
                </p>
              )}
              {nutritionist.planIncludes && (
                <p className="whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Plan includes:</span> {nutritionist.planIncludes}
                </p>
              )}
              {fee && (
                <p className="text-sm">
                  <span className="font-medium">Fee:</span> {fee}
                </p>
              )}
            </div>
            {status === "ACCEPTED" && (
              <span className="text-sm text-emerald-700 dark:text-emerald-400">Working together</span>
            )}
            {status === "PENDING" && <span className="text-sm text-zinc-500">Request sent</span>}
            {(status === undefined || status === "REJECTED") && (
              <form action={request} className="flex items-center gap-3">
                {status === "REJECTED" && (
                  <span className="text-sm text-zinc-500">Previous request declined</span>
                )}
                <button className={primaryButton}>
                  {status === "REJECTED" ? "Request again" : "Request to work together"}
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
