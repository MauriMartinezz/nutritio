import { getMessages } from "@/lib/i18n/server";
import { badge, buttonPrimary, muted } from "@/modules/ui/classes";
import { requestNutritionist } from "../actions";
import type { DirectoryNutritionist } from "../directory-dal";
import { coachingMessages } from "../messages";
import { SubmitButton } from "./submit-button";

/** The client's link status with a nutritionist, or the button to ask to work together. */
export async function RequestNutritionist({ nutritionist }: { nutritionist: DirectoryNutritionist }) {
  const t = await getMessages(coachingMessages);
  const status = nutritionist.linkStatus;
  if (status === "ACCEPTED") return <span className={badge("success")}>{t.workingTogether}</span>;
  if (status === "PENDING") return <span className={badge("warning")}>{t.requestSent}</span>;

  return (
    <form action={requestNutritionist.bind(null, nutritionist.id)} className="flex flex-wrap items-center gap-3">
      {status === "REJECTED" && <span className={muted}>{t.previousDeclined}</span>}
      <SubmitButton className={buttonPrimary}>
        {status === "REJECTED" ? t.requestAgain : t.requestToWorkTogether}
      </SubmitButton>
    </form>
  );
}
