"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useMessages } from "@/lib/i18n/client";
import { buttonSecondary } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { authMessages } from "../auth-messages";

export function SignOutButton({ className = "" }: { className?: string }) {
  const t = useMessages(authMessages);
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    // A full page load, not a client navigation: it drops every page kept in the
    // router's memory, including a sign-in form that still held typed credentials.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load is the point
    window.location.assign("/");
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={pending} className={`${buttonSecondary} ${className}`}>
      <ButtonLabel pending={pending} pendingText={t.signingOut}>
        {t.signOut}
      </ButtonLabel>
    </button>
  );
}
