"use client";

import { useFormStatus } from "react-dom";
import { ButtonLabel } from "@/modules/ui/components/spinner";

/** Submit button that shows a spinner while its form's action runs. */
export function SubmitButton({ className, children }: { className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      <ButtonLabel pending={pending}>{children}</ButtonLabel>
    </button>
  );
}
