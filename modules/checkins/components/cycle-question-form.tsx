import { getLocale } from "@/lib/i18n/server";
import { buttonSecondary, fieldHint } from "@/modules/ui/classes";
import { FlashNotice, SubmitButton } from "@/modules/ui/components/action-feedback";
import { setCycleQuestion } from "../actions";
import { asQuestion } from "../format";
import { checkInLabels, clientCheckInMessages } from "../messages";

/**
 * The nutritionist turns the menstrual cycle question on or off. Only offered
 * when the client said she is a woman.
 */
export async function CycleQuestionForm({
  clientId,
  askCycle,
  clientSex,
}: {
  clientId: string;
  askCycle: boolean;
  clientSex: "FEMALE" | "MALE" | null;
}) {
  if (clientSex === "MALE") return null;
  const locale = await getLocale();
  const t = clientCheckInMessages[locale];
  if (clientSex === null) return <p className={fieldHint}>{t.noSex}</p>;

  return (
    <form action={setCycleQuestion.bind(null, clientId)} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="askCycle" value={askCycle ? "off" : "on"} />
      <p className="text-sm">
        {t.cycleQuestion}{" "}
        <span className="font-medium">{askCycle ? t.cycleAsked : t.notAsked}</span>
        <span className={`${fieldHint} block`}>&ldquo;{asQuestion(checkInLabels[locale].cycleQuestion, locale)}&rdquo;</span>
      </p>
      <SubmitButton pendingText={t.saving} className={buttonSecondary}>
        {askCycle ? t.stopAsking : t.askInCheckIns}
      </SubmitButton>
      <FlashNotice />
    </form>
  );
}
