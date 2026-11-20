"use client";

import { useFormStatus } from "react-dom";
import { ButtonLabel } from "@/modules/ui/components/spinner";

/** A form's submit button that shows a spinner and `pendingText` while the action runs. */
export function SubmitButton({
  pendingText,
  className,
  children,
}: {
  pendingText: string;
  className: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={className}>
      <ButtonLabel pending={pending} pendingText={pendingText}>
        {children}
      </ButtonLabel>
    </button>
  );
}
