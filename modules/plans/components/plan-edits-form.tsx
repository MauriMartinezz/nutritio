"use client";

// The plan editor is one form: every field and button anywhere on the page joins it with
// the `form` attribute, and a single "Save changes" button at the end submits it. Other
// buttons (add, remove, switch, search) submit the same form with an `intent`, so the
// pending edits are saved before they run.

import { createContext, use, useActionState, useState, type ComponentProps, type KeyboardEvent } from "react";
import { useMessages } from "@/lib/i18n/client";
import { buttonPrimary, callout, cardAccent, fieldError, formSuccess } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import type { PlanEditorState } from "../actions";
import { planMessages } from "../messages";

const FORM_ID = "plan-edits";

type EditorContext = {
  state: PlanEditorState;
  pending: boolean;
  active: string | null;
  setActive: (intent: string) => void;
};

const Context = createContext<EditorContext>({ state: {}, pending: false, active: null, setActive: () => {} });

type Action = (state: PlanEditorState, formData: FormData) => Promise<PlanEditorState>;

export function PlanEditsForm({ action, children }: { action: Action; children: React.ReactNode }) {
  const t = useMessages(planMessages);
  const [state, formAction, pending] = useActionState(action, {});
  const [active, setActive] = useState<string | null>(null);
  const problems = state.problems ?? {};
  const hasProblems = Object.keys(problems).length > 0;

  return (
    <Context value={{ state, pending, active, setActive }}>
      {/* First submit button of the form, so Enter in a field saves instead of removing something. */}
      <button form={FORM_ID} name="intent" value="save" tabIndex={-1} aria-hidden className="sr-only" />
      {children}
      <form
        id={FORM_ID}
        action={formAction}
        className={cardAccent}
      >
        {hasProblems && (
          <p role="alert" className={callout("danger")}>
            {problems.form ?? t.fixFields}
          </p>
        )}
        {state.saved && !pending && (
          <p role="status" className={formSuccess}>
            {t.changesSaved}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-secondary">{t.saveHint}</p>
          <button
            name="intent"
            value="save"
            disabled={pending}
            onClick={() => setActive("save")}
            className={buttonPrimary}
          >
            <ButtonLabel pending={pending && active === "save"} pendingText={t.savingChanges}>
              {t.saveChanges}
            </ButtonLabel>
          </button>
        </div>
      </form>
    </Context>
  );
}

/** Enter in a field runs the button of `enterIntent` (e.g. search) instead of saving. */
function submitOnEnter(enterIntent: string | undefined) {
  if (!enterIntent) return undefined;
  return (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const button = document.querySelector<HTMLButtonElement>(
      `button[form="${FORM_ID}"][value="${CSS.escape(enterIntent)}"]`,
    );
    if (button && !button.disabled) button.click();
  };
}

function FieldProblem({ name }: { name: string }) {
  const problem = use(Context).state.problems?.[name];
  if (!problem) return null;
  return (
    <p id={`${name}-problem`} role="alert" className={`${fieldError} basis-full`}>
      {problem}
    </p>
  );
}

type InputProps = Omit<ComponentProps<"input">, "form" | "name"> & { name: string; enterIntent?: string };

export function EditInput({ name, defaultValue, enterIntent, ...props }: InputProps) {
  const { state } = use(Context);
  const problem = state.problems?.[name];
  return (
    <>
      <input
        {...props}
        form={FORM_ID}
        name={name}
        defaultValue={state.values?.[name] ?? defaultValue}
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? `${name}-problem` : undefined}
        onKeyDown={submitOnEnter(enterIntent)}
      />
      <FieldProblem name={name} />
    </>
  );
}

type TextareaProps = Omit<ComponentProps<"textarea">, "form" | "name"> & { name: string };

export function EditTextarea({ name, defaultValue, ...props }: TextareaProps) {
  const { state } = use(Context);
  const problem = state.problems?.[name];
  return (
    <>
      <textarea
        {...props}
        form={FORM_ID}
        name={name}
        defaultValue={state.values?.[name] ?? defaultValue}
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? `${name}-problem` : undefined}
      />
      <FieldProblem name={name} />
    </>
  );
}

/** A button that saves the pending edits, then runs its intent ("removeMeal:<id>", "addMeal"...). */
export function IntentButton({
  intent,
  pendingText,
  noValidate = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<"button">, "form" | "name" | "value" | "onClick"> & {
  intent: string;
  pendingText: string;
  /** Skip the browser's field checks (e.g. deleting the whole plan). */
  noValidate?: boolean;
}) {
  const { pending, active, setActive } = use(Context);
  return (
    <button
      {...props}
      form={FORM_ID}
      name="intent"
      value={intent}
      formNoValidate={noValidate || undefined}
      disabled={pending}
      onClick={() => setActive(intent)}
      className={className}
    >
      <ButtonLabel pending={pending && active === intent} pendingText={pendingText}>
        {children}
      </ButtonLabel>
    </button>
  );
}
