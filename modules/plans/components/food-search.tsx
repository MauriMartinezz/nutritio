"use client";

// Add-food box of a meal: results appear while typing (no page load), and picking one
// submits the editor form with an "addItem" intent, so pending edits are saved too.
// The box keeps its text and results afterwards, so several foods can be added in a row.

import { use, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { formatNumber } from "@/lib/i18n/format";
import { Spinner } from "@/modules/ui/components/spinner";
import { findFoods } from "../actions";
import { planMessages } from "../messages";
import { EditorStateContext, FORM_ID } from "./plan-edits-form";

type Food = Awaited<ReturnType<typeof findFoods>>[number];

const DEBOUNCE_MS = 200;
const DEFAULT_GRAMS = 100;

export function FoodSearch({ mealId, mealName }: { mealId: string; mealName: string }) {
  const t = useMessages(planMessages);
  const locale = useLocale();
  const { pending, setActive } = use(EditorStateContext);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const latest = useRef(0);
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return;
    const request = ++latest.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await findFoods(term);
        // Only the newest request may update the list (typing fast sends several).
        if (request === latest.current) {
          setResults(found);
          setHighlighted(0);
        }
      } finally {
        if (request === latest.current) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const shown = term.length < 2 ? [] : results;
  const intentFor = (food: Food) => `addItem:${mealId}:${food.id}`;

  function add(food: Food) {
    setActive(intentFor(food));
    document.querySelector<HTMLButtonElement>(`button[form="${FORM_ID}"][value="${CSS.escape(intentFor(food))}"]`)?.click();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (shown.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted((index) => (index + step + shown.length) % shown.length);
    } else if (event.key === "Enter") {
      // Never let Enter here save the whole form.
      event.preventDefault();
      const food = shown[highlighted];
      if (food && !pending) add(food);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const expanded = open && term.length > 0;

  return (
    <div className="relative">
      <div className="flex min-h-11 items-center gap-2 rounded-control border border-dashed border-line-strong bg-surface px-3 focus-within:border-solid focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
        <span aria-hidden className="text-lg leading-none text-tertiary">
          +
        </span>
        <input
          type="search"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && shown[highlighted] ? `${listId}-${shown[highlighted].id}` : undefined}
          aria-label={t.addFoodTo(mealName)}
          placeholder={t.addFoodPlaceholder}
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-tertiary"
        />
        {(searching || pending) && <Spinner />}
        {expanded && shown.length > 0 && (
          <span className="hidden shrink-0 font-mono text-xs text-tertiary sm:inline">{t.enterToAdd}</span>
        )}
      </div>

      {/* Hidden buttons + grams the form submits; the visible rows click them. */}
      {shown.map((food) => (
        <span key={food.id} hidden>
          <input form={FORM_ID} name={`add.${food.id}.grams`} type="hidden" value={DEFAULT_GRAMS} />
          <button form={FORM_ID} name="intent" value={intentFor(food)} tabIndex={-1} disabled={pending} />
        </span>
      ))}

      {expanded && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-card border border-line bg-surface">
          {term.length < 2 ? (
            <p className="px-3 py-2.5 text-sm text-secondary">{t.typeMore}</p>
          ) : shown.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-secondary">{searching ? t.pending.searching : t.noMatches(term)}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label={t.addFoodTo(mealName)} className="max-h-72 overflow-y-auto py-1">
              {shown.map((food, index) => (
                <li
                  key={food.id}
                  id={`${listId}-${food.id}`}
                  role="option"
                  aria-selected={index === highlighted}
                  // mousedown keeps the focus in the box, so the list stays open for the next food.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (!pending) add(food);
                  }}
                  onMouseEnter={() => setHighlighted(index)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                    index === highlighted ? "bg-surface-muted" : ""
                  }`}
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{food.label}</span>
                    {food.preparation && (
                      <span className="text-secondary">
                        {" "}
                        · {food.preparation === "RAW" ? t.raw : t.cooked}
                        {food.preparationNote && ` (${food.preparationNote})`}
                      </span>
                    )}
                  </span>
                  {food.kcal !== null && (
                    <span className="shrink-0 font-mono text-xs text-secondary tabular-nums">
                      {formatNumber(Math.round(food.kcal), locale)} {t.per100}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
