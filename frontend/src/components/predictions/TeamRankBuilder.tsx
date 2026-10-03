"use client";

import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Team } from "@/types";
import RankSlot from "./RankSlot";

interface Props {
  order: Team[];
  onReorder: (next: Team[]) => void;
  disabled: boolean;
}

export default function TeamRankBuilder({ order, onReorder, disabled }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: { active: { id: string | number }; over: { id: string | number } | null }) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((t) => t.id === active.id);
    const newIndex = order.findIndex((t) => t.id === over.id);
    onReorder(arrayMove(order, oldIndex, newIndex));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= order.length) return;
    onReorder(arrayMove(order, index, next));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {order.map((team, i) => (
            <RankSlot
              key={team.id}
              team={team}
              rank={i + 1}
              canMoveUp={i > 0}
              canMoveDown={i < order.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}