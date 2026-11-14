import { buttonSecondary, fieldHint } from "@/modules/ui/classes";
import { setCycleQuestion } from "../actions";
import { CYCLE_QUESTION } from "../rules";

/**
 * The nutritionist turns the menstrual cycle question on or off. Only offered
 * when the client said she is a woman.
 */
export function CycleQuestionForm({
  clientId,
  askCycle,
  clientSex,
}: {
  clientId: string;
  askCycle: boolean;
  clientSex: "FEMALE" | "MALE" | null;
}) {
  if (clientSex === "MALE") return null;
  if (clientSex === null) {
    return <p className={fieldHint}>The client hasn&apos;t said if she is a woman or a man in her profile yet.</p>;
  }

  return (
    <form action={setCycleQuestion.bind(null, clientId)} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="askCycle" value={askCycle ? "off" : "on"} />
      <p className="text-sm">
        Menstrual cycle question:{" "}
        <span className="font-medium">{askCycle ? "asked in every check-in" : "not asked"}</span>
        <span className={`${fieldHint} block`}>&ldquo;{CYCLE_QUESTION}?&rdquo;</span>
      </p>
      <button className={buttonSecondary}>{askCycle ? "Stop asking" : "Ask in check-ins"}</button>
    </form>
  );
}
