import { getMessages } from "@/lib/i18n/server";
import { callout, card, eyebrow, h1, type Tone } from "@/modules/ui/classes";
import { prisma } from "@/lib/prisma";
import { Landing } from "@/modules/home/components/landing";
import { ResubmitForm } from "@/modules/nutritionists/components/resubmit-form";
import { FlashNotice } from "@/modules/ui/components/action-feedback";
import { formatBirthDate } from "@/modules/nutritionists/profile";
import { getCurrentUser } from "../dal";
import { accountMessages } from "../messages";
import { roleMessages } from "../nav-messages";

const STATUS_TONES: Record<"PENDING" | "APPROVED" | "REJECTED", Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

/** Reads the session, so it must be rendered inside a <Suspense> boundary. */
export async function AccountPanel() {
  const user = await getCurrentUser();

  if (!user) return <Landing />;

  // Clients, admins and approved nutritionists get a dashboard (modules/home) instead.
  if (user.role !== "NUTRITIONIST" || user.nutritionistStatus === "APPROVED") return null;

  const [t, roles] = await Promise.all([getMessages(accountMessages), getMessages(roleMessages)]);
  const statusMessages = { PENDING: t.statusPending, APPROVED: t.statusApproved, REJECTED: t.statusRejected };

  const review =
    user.role === "NUTRITIONIST"
      ? await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            verificationNote: true,
            dni: true,
            licenseNumber: true,
            birthDate: true,
            phone: true,
            specialty: true,
          },
        })
      : null;

  return (
    <section className={card}>
      <p className={eyebrow}>{roles[user.role]}</p>
      <h1 className={h1}>{t.hi(user.name.split(/\s+/)[0])}</h1>
      {user.nutritionistStatus && (
        <div className={`${callout(STATUS_TONES[user.nutritionistStatus])} flex flex-col gap-1`}>
          <p>{statusMessages[user.nutritionistStatus]}</p>
          {review?.verificationNote && (
            <p className="whitespace-pre-line">
              <span className="font-semibold">{t.adminNote}</span> {review.verificationNote}
            </p>
          )}
        </div>
      )}
      {user.nutritionistStatus === "REJECTED" && review && (
        <ResubmitForm
          values={{
            dni: review.dni,
            licenseNumber: review.licenseNumber,
            birthDate: review.birthDate ? formatBirthDate(review.birthDate) : null,
            phone: review.phone,
            specialty: review.specialty,
          }}
        />
      )}
      {user.nutritionistStatus && <FlashNotice />}
    </section>
  );
}
