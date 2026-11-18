"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonSecondary } from "@/modules/ui/classes";

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className={`${buttonSecondary} ${className}`}>
      Sign out
    </button>
  );
}
