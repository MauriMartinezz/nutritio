"use client";

import { startTransition, useOptimistic, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMessages } from "@/lib/i18n/client";
import { callout } from "@/modules/ui/classes";
import { reorderMeals } from "../actions";
import { planMessages } from "../messages";

type SortableMeal = { id: string; name: string; card: ReactNode };

/**
 * Meal cards reordered by drag and drop (mouse, touch, or keyboard: focus the
 * handle, Space to lift, arrows to move, Space to drop). The cards themselves
 * are rendered on the server and passed in.
 */
export function SortableMeals({ planId, meals }: { planId: string; meals: SortableMeal[] }) {
  const t = useMessages(planMessages);
  const [order, setOptimisticOrder] = useOptimistic(meals.map((meal) => meal.id));
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const byId = new Map(meals.map((meal) => [meal.id, meal]));

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
    setError(null);
    startTransition(async () => {
      setOptimisticOrder(next);
      try {
        await reorderMeals(planId, next);
      } catch {
        // The optimistic order reverts on its own when the transition ends.
        setError(t.reorderFailed);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className={callout("danger")}>
          {error}
        </p>
      )}
      <DndContext
        id={`meals-${planId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {order.map((id) => {
              const meal = byId.get(id);
              return meal ? <SortableMealCard key={id} meal={meal} /> : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableMealCard({ meal }: { meal: SortableMeal }) {
  const t = useMessages(planMessages);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: meal.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex w-full gap-2 rounded-card-lg border bg-surface p-4 sm:gap-3 md:p-5 ${
        isDragging ? "relative z-10 border-accent opacity-95 ring-2 ring-accent/30" : "border-line"
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t.dragToReorder(meal.name)}
        className="-ml-2 flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-lg leading-none text-tertiary hover:bg-surface-muted hover:text-ink active:cursor-grabbing"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">{meal.card}</div>
    </div>
  );
}
