"use client";

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function PredictionSortableList({ initialDrivers, raceId, type }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(initialDrivers || []);
    setMounted(true);
  }, [initialDrivers]);

  const sensors = useSensors(useSensor(PointerSensor, { 
    activationConstraint: { delay: 250, tolerance: 5 } 
  }));

  if (!mounted) return <div className="text-white p-10">Laden...</div>;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.driver_id === active.id);
        const newIndex = prev.findIndex((i) => i.driver_id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="flex flex-col space-y-2 pr-10">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.driver_id)} strategy={verticalListSortingStrategy}>
          {items.map((driver) => (
            <SortableItem key={driver.driver_id} driver={driver} />
          ))}
        </SortableContext>
      </DndContext>
      <button className="bg-red-600 p-4 rounded-xl font-bold uppercase mt-4">Sla op</button>
    </div>
  );
}

function SortableItem({ driver }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: driver.driver_id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: 'none' as const
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-4 bg-[#161a23] border border-slate-800 rounded-lg flex items-center">
      <div className="w-2 h-6 mr-3 rounded" style={{ backgroundColor: driver.color_code }} />
      <span className="text-white font-bold">{driver.driver_name}</span>
    </div>
  );
}