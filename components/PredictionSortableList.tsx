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

// Individuele coureur-rij
function SortableDriver({ driver, index }: { driver: any, index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: driver.driver_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
    // touchAction: 'none' is essentieel om scrollen te voorkomen tijdens het slepen op mobiel
    touchAction: 'none', 
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center mb-2 bg-[#161a23] border ${
        isDragging ? 'border-red-600 shadow-2xl scale-[1.02]' : 'border-slate-800'
      } rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all`}
    >
      <div className="w-12 h-12 flex items-center justify-center bg-black/20 font-bold text-slate-500">
        {index + 1}
      </div>
      <div 
        className="w-1.5 h-8 ml-2 rounded-full" 
        style={{ backgroundColor: driver.teams?.color_code || '#ccc' }} 
      />
      <div className="p-3 flex-1">
        <div className="font-bold italic uppercase text-sm">{driver.driver_name}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{driver.teams?.team_name}</div>
      </div>
      <div className="pr-4 opacity-30">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 7h2v2H7V7zm0 4h2v2H7v-2zm4-4h2v2h-2V7zm0 4h2v2h-2v-2z" />
        </svg>
      </div>
    </div>
  );
}

interface Props {
  initialDrivers: any[];
  raceId: string;
  type: string;
}

export default function PredictionSortableList({ initialDrivers, raceId, type }: Props) {
  const [items, setItems] = useState(initialDrivers);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // De PointerSensor is geconfigureerd met een 'activationConstraint'. 
  // Dit zorgt ervoor dat een klik pas een 'drag' wordt als de muis/vinger 5 pixels beweegt.
  // Dit lost het probleem op waarbij items wel trillen maar niet verschuiven.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, 
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.driver_id === active.id);
        const newIndex = items.findIndex((i) => i.driver_id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const orderedIds = items.map(item => item.driver_id);
      const result = await savePrediction(raceId, type, orderedIds);

      if (result.success) {
        router.push(`/races/${raceId}`);
        router.refresh();
      } else {
        alert("Fout bij opslaan: " + result.message);
      }
    } catch (error) {
      alert("Er is een onverwachte fout opgetreden.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.driver_id)} strategy={verticalListSortingStrategy}>
        <div className="max-w-md mx-auto pb-20">
          {items.map((driver, index) => (
            <SortableDriver key={driver.driver_id} driver={driver} index={index} />
          ))}
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full mt-6 bg-red-600 text-white font-black italic uppercase py-4 rounded-xl shadow-lg transition-all ${
              isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500 active:scale-95'
            }`}
          >
            {isSaving ? 'Bezig met opslaan...' : 'Sla Voorspelling Op'}
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}