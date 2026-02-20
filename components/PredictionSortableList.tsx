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

// 1. Interfaces strak gedefinieerd
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

// 2. De individuele component
function SortableDriver({ 
  driver, 
  index, 
  isOverlay = false 
}: { 
  driver: Driver; 
  index: number; 
  isOverlay?: boolean 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: driver.driver_id });

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
        isOverlay 
          ? 'border-red-600 shadow-2xl scale-[1.02] z-[100]' 
          : 'border-slate-800'
      } cursor-grab active:cursor-grabbing`}
    >
      <div className={`w-12 h-12 flex items-center justify-center font-bold ${isOverlay ? 'bg-red-600 text-white' : 'bg-black/20 text-slate-500'}`}>
        {index + 1}
      </div>
      <div className="w-1.5 h-8 ml-2 rounded-full" style={{ backgroundColor: driver.teams?.color_code || '#ccc' }} />
      <div className="p-3 flex-1 text-left">
        <div className="font-bold italic uppercase text-sm text-white leading-none mb-1">
          {driver.driver_name}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">
          {driver.teams?.team_name}
        </div>
      </div>
      <div className="pr-4 opacity-20">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
        </svg>
      </div>
    </div>
  );
}

export default function PredictionSortableList({ initialDrivers, raceId, type }: Props) {
  const [items, setItems] = useState<Driver[]>(initialDrivers);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false); // Fix voor client-side hydration
  const router = useRouter();

  // Zorg ervoor dat dnd-kit pas rendert als de browser klaar is
  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((i) => i.driver_id === active.id);
        const newIndex = prevItems.findIndex((i) => i.driver_id === over?.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const orderedIds = items.map((item) => item.driver_id);
      const result = await savePrediction(raceId, type, orderedIds);
      if (result.success) {
        router.push(`/races/${raceId}`);
        router.refresh();
      } else {
        alert("Fout bij opslaan: " + result.message);
      }
    } catch (error) {
      alert("Er is een onverwachte fout opgetreden.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Als de component nog niet gemount is, tonen we een placeholder 
  // Dit voorkomt de "client-side exception" error
  if (!mounted) {
    return <div className="p-10 text-center text-slate-500 italic uppercase font-black animate-pulse">Lijst laden...</div>;
  }

  const activeDriver = activeId ? items.find(i => i.driver_id === activeId) : null;

  return (
    <div className="flex flex-col h-[78vh]">
      {/* Brede scroll-zone (pr-12) */}
      <div className="flex-1 overflow-y-auto pr-12 pl-2 mb-4 custom-scrollbar">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items.map((i) => i.driver_id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {items.map((driver, index) => (
                <SortableDriver 
                  key={driver.driver_id} 
                  driver={driver} 
                  index={index} 
                />
              ))}
            </div>
          </SortableContext>

          {/* Overlay voor direct na-ijlen te voorkomen */}
          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.3' } }
            })
          }}>
            {activeDriver ? (
              <SortableDriver 
                driver={activeDriver} 
                index={items.findIndex(i => i.driver_id === activeId)} 
                isOverlay 
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="pb-6 pr-12">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full bg-red-600 text-white font-black italic uppercase py-5 rounded-xl shadow-lg transition-all ${
            isSaving ? 'opacity-50' : 'active:scale-95 hover:bg-red-500'
          }`}
        >
          {isSaving ? 'Bezig met opslaan...' : 'Sla Voorspelling Op'}
        </button>
      </div>
    </div>
  );
}