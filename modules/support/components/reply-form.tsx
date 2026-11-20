"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import { buttonPrimary, buttonSecondary, fieldError, formSuccess, label, textarea } from "@/modules/ui/classes";
import { Spinner } from "@/modules/ui/components/spinner";
import { answerSupportRequest, type SupportFormState } from "../actions";
import { supportMessages } from "../messages";
import { SUPPORT_LIMITS } from "../support";

/** The admin's answer: send it, or send it and close the request as completed. */
export function ReplyForm({ requestId, reply, resolved }: { requestId: string; reply: string | null; resolved: boolean }) {
  const t = useMessages(supportMessages);
  const [state, formAction, pending] = useActionState<SupportFormState, FormData>(answerSupportRequest, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-divider pt-4">
      <input type="hidden" name="requestId" value={requestId} />
      <label className={label}>
        {t.writeReply}
        <textarea
          name="reply"
          required
          rows={4}
          maxLength={SUPPORT_LIMITS.reply}
          defaultValue={state.values?.reply ?? reply ?? ""}
          placeholder={t.replyPlaceholder}
          className={`${textarea} w-full`}
        />
      </label>
      {Object.values(problems).map((message) => (
        <p key={message} role="alert" className={fieldError}>
          {message}
        </p>
      ))}
      {state.saved && (
        <p role="status" className={formSuccess}>
          {state.saved === "resolved" ? t.resolvedSaved : t.replySaved}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {!resolved && (
          <button name="decision" value="resolve" disabled={pending} className={buttonPrimary}>
            {pending && <Spinner />}
            {t.resolve}
          </button>
        )}
        <button name="decision" value="reply" disabled={pending} className={resolved ? buttonPrimary : buttonSecondary}>
          {pending && resolved && <Spinner />}
          {t.sendReply}
        </button>
      </div>
    </form>
  );
}
