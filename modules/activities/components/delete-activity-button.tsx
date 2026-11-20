"use client";

import { useFormStatus } from "react-dom";
import { useMessages } from "@/lib/i18n/client";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { activityMessages } from "../messages";

/** Submit button of a row's delete form; shows a spinner while it runs. */
export function DeleteActivityButton() {
  const t = useMessages(activityMessages);
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-danger hover:underline disabled:opacity-50"
    >
      <ButtonLabel pending={pending} pendingText={t.deleting}>
        {t.delete}
      </ButtonLabel>
    </button>
  );
}
