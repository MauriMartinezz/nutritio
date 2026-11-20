import Link from "next/link";
import {
  buttonPrimary,
  buttonSecondary,
  callout,
  card,
  eyebrow,
  h1,
  type Tone,
} from "@/modules/ui/classes";
import { prisma } from "@/lib/prisma";
import { ResubmitForm } from "@/modules/nutritionists/components/resubmit-form";
import { formatBirthDate } from "@/modules/nutritionists/profile";
import { getCurrentUser } from "../dal";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  NUTRITIONIST: "Nutritionist",
  CLIENT: "Client",
} as const;

const STATUS_MESSAGES = {
  PENDING: "Your nutritionist profile is waiting for admin verification.",
  APPROVED:
    "Your nutritionist profile is verified and listed in the directory.",
  REJECTED: "Your nutritionist profile was not approved. You can correct it and send it again below.",
} as const;

const STATUS_TONES: Record<keyof typeof STATUS_MESSAGES, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

/** Reads the session, so it must be rendered inside a <Suspense> boundary. */
export async function AccountPanel() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <section className="flex flex-col gap-5">
        <h1 className={h1}>Nutritio</h1>
        <p className="max-w-xl text-lg text-secondary">
          Nutrition plans and progress tracking for nutritionists and their
          clients.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-in" className={buttonPrimary}>
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonSecondary}>
            Create an account
          </Link>
        </div>
      </section>
    );
  }

  // Clients, admins and approved nutritionists get a dashboard (modules/home) instead.
  if (user.role !== "NUTRITIONIST" || user.nutritionistStatus === "APPROVED") return null;

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
      <p className={eyebrow}>{ROLE_LABELS[user.role]}</p>
      <h1 className={h1}>Hi, {user.name.split(/\s+/)[0]}</h1>
      {user.nutritionistStatus && (
        <div className={`${callout(STATUS_TONES[user.nutritionistStatus])} flex flex-col gap-1`}>
          <p>{STATUS_MESSAGES[user.nutritionistStatus]}</p>
          {review?.verificationNote && (
            <p className="whitespace-pre-line">
              <span className="font-semibold">Note from the admin:</span> {review.verificationNote}
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
    </section>
  );
}
