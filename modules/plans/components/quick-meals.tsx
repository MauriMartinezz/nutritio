"use client";

import { use } from "react";
import { useMessages } from "@/lib/i18n/client";
import { planMessages } from "../messages";
import { EditorStateContext, FORM_ID } from "./plan-edits-form";

/** One-click "add meal" chips for the usual meal names the plan doesn't have yet. */
export function QuickMeals({ inputId, existing }: { inputId: string; existing: string[] }) {
  const t = useMessages(planMessages);
  const { pending, setActive } = use(EditorStateContext);
  const taken = new Set(existing.map((name) => name.trim().toLowerCase()));
  const names = t.quickMeals.filter((name) => !taken.has(name.toLowerCase()));
  if (names.length === 0) return null;

  function add(name: string) {
    const field = document.getElementById(inputId);
    if (!(field instanceof HTMLInputElement)) return;
    field.value = name;
    setActive("addMeal");
    document.querySelector<HTMLButtonElement>(`button[form="${FORM_ID}"][value="addMeal"]`)?.click();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-secondary">{t.quickAdd}</span>
      {names.map((name) => (
        <button
          key={name}
          type="button"
          disabled={pending}
          onClick={() => add(name)}
          className="min-h-9 rounded-full border border-line-strong px-3 text-xs font-medium hover:bg-surface-muted disabled:opacity-50"
        >
          {name}
        </button>
      ))}
    </div>
  );
}
