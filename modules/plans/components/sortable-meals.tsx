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
import { reorderMeals } from "../actions";

type SortableMeal = { id: string; name: string; card: ReactNode };

/**
 * Meal cards reordered by drag and drop (mouse, touch, or keyboard: focus the
 * handle, Space to lift, arrows to move, Space to drop). The cards themselves
 * are rendered on the server and passed in.
 */
export function SortableMeals({ planId, meals }: { planId: string; meals: SortableMeal[] }) {
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
        setError("Could not save the new order. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">
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
          <div className="flex flex-col gap-8">
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
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: meal.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex w-full gap-3 rounded-lg border border-zinc-200 bg-background p-4 dark:border-zinc-800 ${
        isDragging ? "relative z-10 opacity-90 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${meal.name}`}
        className="-ml-1 flex w-5 shrink-0 cursor-grab touch-none items-start justify-center pt-1.5 text-lg leading-none text-zinc-400 hover:text-zinc-700 active:cursor-grabbing dark:hover:text-zinc-200"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">{meal.card}</div>
    </div>
  );
}
