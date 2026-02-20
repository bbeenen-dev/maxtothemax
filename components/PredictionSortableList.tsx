"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { savePrediction } from '@/app/races/[id]/predict/[type]/actions';

interface Driver {
  driver_id: string;
  driver_name: string;
  teams?: {
    team_name: string;
    color_code: string;
  };
}

interface Props {
  initialDrivers: Driver[];
  raceId: string;
  type: string;
}

// Sub-component voor de items
function SortableDriver({ driver, index, isOverlay = false }: { driver: Driver, index: number, isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: driver.driver_id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    zIndex: isDragging ? 100 : 1,
    touchAction: 'none', 
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center mb-2 bg-[#161a23] border-2 transition-all rounded-lg overflow-hidden ${
        isOverlay ? 'border-red-600 shadow-2xl scale-[1.02] z-[100]' : 'border-slate-800'
      } cursor-grab active:cursor-grabbing`}
    >
      <div className={`w-12 h-12 flex items-center justify-center font-bold ${isOverlay ? 'bg-red-600 text-white' : 'bg-black/20 text-slate-500'}`}>
        {index + 1}
      </div>
      <div className="w-1.5 h-8 ml-2 rounded-full" style={{ backgroundColor: driver.teams?.color_code || '#ccc' }} />
      <div className="p-3 flex-1 text-left">
        <div className="font-bold italic uppercase text-sm text-white leading-none mb-1">{driver.driver_name}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">{driver.teams?.team_name}</div>
      </div>
    </div>
  );
}

export default function PredictionSortableList({ initialDrivers, raceId, type }: Props) {
  const [items, setItems] = useState<Driver[]>(initialDrivers);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150, // Iets langer wachten om scroll-conflicten te voorkomen
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!mounted) return <div className="p-10 text-center text-slate-500 animate-pulse">Laden...</div>;

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (active.id !== over?.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.driver_id === active.id);
        const newIndex = prev.findIndex((i) => i.driver_id === over?.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await savePrediction(raceId, type, items.map(i => i.driver_id));
      if (result.success) { router.push(`/races/${raceId}`); router.refresh(); }
      else { alert(result.message); }
    } catch { alert("Fout bij opslaan."); }
    finally { setIsSaving(false); }
  };

  const activeDriver = activeId ? items.find(i => i.driver_id === activeId) : null;

  return (
    <div className="flex flex-col h-[75vh]">
      {/* DE OPLOSSING VOOR DE SCROLLBALK:
          'pr-14' geeft een extra brede strook (56px) rechts voor de duim.
      */}
      <div className="flex-1 overflow-y-auto pr-14 pl-2 mb-4 custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.driver_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {items.map((driver, index) => (
                <SortableDriver key={driver.driver_id} driver={driver} index={index} />
              ))}
            </div>
          </SortableContext>

          {/* DE OPLOSSING VOOR HET NA-IJLEN:
              DragOverlay zorgt dat de kaart direct je vinger volgt.
          */}
          <DragOverlay>
            {activeDriver ? (
              <SortableDriver driver={activeDriver} index={items.findIndex(i => i.driver_id === activeId)} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="pb-6 pr-14">
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`w-full bg-red-600 text-white font-black italic uppercase py-5 rounded-xl ${isSaving ? 'opacity-50' : 'active:scale-95'}`}
        >
          {isSaving ? 'Opslaan...' : 'Sla Voorspelling Op'}
        </button>
      </div>
    </div>
  );
}