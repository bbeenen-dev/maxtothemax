"use client";

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Simpele interface om crashes te voorkomen
interface Driver {
  driver_id: string;
  driver_name: string;
  team_name: string;
  color_code: string;
}

function SortableItem({ driver, index, isOverlay }: { driver: Driver; index: number; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: driver.driver_id });
  const style = { transform: CSS.Translate.toString(transform), transition, touchAction: 'none' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center mb-2 bg-[#161a23] border-2 rounded-lg overflow-hidden ${isOverlay ? 'border-red-600 z-50 shadow-2xl' : 'border-slate-800'}`}
    >
      <div className="w-10 h-12 flex items-center justify-center bg-black/20 font-bold text-slate-500">{index + 1}</div>
      <div className="w-1.5 h-8 mx-2 rounded-full" style={{ backgroundColor: driver.color_code }} />
      <div className="flex-1 p-2 text-left">
        <div className="font-bold text-sm text-white uppercase italic">{driver.driver_name}</div>
        <div className="text-[10px] text-slate-500 uppercase">{driver.team_name}</div>
      </div>
    </div>
  );
}

export default function PredictionSortableList({ initialDrivers, raceId, type }: any) {
  const [items, setItems] = useState<Driver[]>(initialDrivers || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }));

  if (!mounted) return <div className="text-white text-center p-10">Laden...</div>;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.driver_id === active.id);
        const newIndex = prev.findIndex((i) => i.driver_id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const activeDriver = items.find(i => i.driver_id === activeId);

  return (
    <div className="flex flex-col pr-12"> {/* Brede scrollruimte */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.driver_id)} strategy={verticalListSortingStrategy}>
          {items.map((driver, index) => (
            <SortableItem key={driver.driver_id} driver={driver} index={index} />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeDriver ? <SortableItem driver={activeDriver} index={items.indexOf(activeDriver)} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
      <button className="mt-4 w-full bg-red-600 p-4 rounded-xl font-bold italic uppercase shadow-lg">Opslaan</button>
    </div>
  );
}