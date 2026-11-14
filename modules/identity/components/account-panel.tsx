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
  REJECTED: "Your nutritionist profile was not approved.",
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

  return (
    <section className={card}>
      <p className={eyebrow}>{ROLE_LABELS[user.role]}</p>
      <h1 className={h1}>Hi, {user.name.split(/\s+/)[0]}</h1>
      {user.nutritionistStatus && (
        <p className={callout(STATUS_TONES[user.nutritionistStatus])}>
          {STATUS_MESSAGES[user.nutritionistStatus]}
        </p>
      )}
    </section>
  );
}
