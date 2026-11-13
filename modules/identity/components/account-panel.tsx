import Link from "next/link";
import { getCurrentUser } from "../dal";
import { SignOutButton } from "./sign-out-button";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  NUTRITIONIST: "Nutritionist",
  CLIENT: "Client",
} as const;

const STATUS_MESSAGES = {
  PENDING: "Your nutritionist profile is waiting for admin verification.",
  APPROVED: "Your nutritionist profile is verified and listed in the directory.",
  REJECTED: "Your nutritionist profile was not approved.",
} as const;

/** Reads the session, so it must be rendered inside a <Suspense> boundary. */
export async function AccountPanel() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex gap-4 text-sm">
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
        <Link href="/sign-up" className="underline">
          Create an account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p>
        Signed in as <strong>{user.name}</strong> ({ROLE_LABELS[user.role]})
      </p>
      {user.nutritionistStatus && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {STATUS_MESSAGES[user.nutritionistStatus]}
        </p>
      )}
      {user.role === "CLIENT" && (
        <Link href="/nutritionists" className="text-sm underline">
          Find a nutritionist
        </Link>
      )}
      {user.role === "CLIENT" && (
        <Link href="/my-plans" className="text-sm underline">
          My meal plans
        </Link>
      )}
      {user.nutritionistStatus === "APPROVED" && (
        <Link href="/clients" className="text-sm underline">
          My clients and requests
        </Link>
      )}
      {user.nutritionistStatus === "APPROVED" && (
        <Link href="/plans" className="text-sm underline">
          Plan templates
        </Link>
      )}
      {user.role === "ADMIN" && (
        <Link href="/admin" className="text-sm underline">
          Manage nutritionists
        </Link>
      )}
      <SignOutButton />
    </div>
  );
}
