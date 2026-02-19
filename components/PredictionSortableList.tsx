"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
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

// Definieer het type voor een Driver
interface Driver {
  driver_id: string;
  driver_name: string;
  teams?: {
    team_name: string;
    color_code: string;
  };
}

// Definieer de Props voor de hoofdcomponent
interface Props {
  initialDrivers: Driver[];
  raceId: string;
  type: string;
}

function SortableDriver({ driver, index }: { driver: Driver, index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: driver.driver_id });

  const style = {
    // Translate is sneller dan Transform voor de browser
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    zIndex: isDragging ? 100 : 1,
    touchAction: 'none', 
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center mb-2 bg-[#161a23] border-2 transition-all rounded-lg overflow-hidden ${
        isDragging 
          ? 'border-red-600 shadow-2xl scale-[1.05] z-50 ring-2 ring-red-600/20' 
          : 'border-slate-800'
      } cursor-grab active:cursor-grabbing`}
    >
      <div className={`w-12 h-12 flex items-center justify-center font-bold ${isDragging ? 'bg-red-600 text-white' : 'bg-black/20 text-slate-500'}`}>
        {index + 1}
      </div>
      <div className="w-1.5 h-8 ml-2 rounded-full" style={{ backgroundColor: driver.teams?.color_code || '#ccc' }} />
      <div className="p-3 flex-1 text-left">
        <div className="font-bold italic uppercase text-sm text-white">
          {driver.driver_name}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{driver.teams?.team_name}</div>
      </div>
    </div>
  );
}

export default function PredictionSortableList({ initialDrivers, raceId, type }: Props) {
  const [items, setItems] = useState<Driver[]>(initialDrivers);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, 
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems((prevItems: Driver[]) => {
        const oldIndex = prevItems.findIndex((i: Driver) => i.driver_id === active.id);
        const newIndex = prevItems.findIndex((i: Driver) => i.driver_id === over?.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const orderedIds = items.map((item: Driver) => item.driver_id);
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

  return (
    <div className="flex flex-col h-[75vh]">
      <div className="flex-1 overflow-y-auto pr-2 mb-4 custom-scrollbar">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i: Driver) => i.driver_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {items.map((driver: Driver, index: number) => (
                <SortableDriver key={driver.driver_id} driver={driver} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="pb-6">
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