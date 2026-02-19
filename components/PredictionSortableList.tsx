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
    // Verhoog de zIndex aanzienlijk tijdens het slepen zodat hij 'over' de rest gaat
    zIndex: isDragging ? 100 : 1,
    // Voorkom dat browser-scrollen het slepen in de weg zit op het kaartje zelf
    touchAction: 'none', 
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      /* Rood kader toegevoegd als isDragging true is */
      className={`flex items-center mb-2 bg-[#161a23] border-2 transition-all rounded-lg overflow-hidden ${
        isDragging 
          ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-[1.05] opacity-90' 
          : 'border-slate-800 hover:border-slate-600'
      } cursor-grab active:cursor-grabbing`}
    >
      <div className={`w-12 h-12 flex items-center justify-center font-bold ${isDragging ? 'bg-red-600/20 text-red-500' : 'bg-black/20 text-slate-500'}`}>
        {index + 1}
      </div>
      <div 
        className="w-1.5 h-8 ml-2 rounded-full" 
        style={{ backgroundColor: driver.teams?.color_code || '#ccc' }} 
      />
      <div className="p-3 flex-1">
        <div className={`font-bold italic uppercase text-sm ${isDragging ? 'text-red-500' : 'text-white'}`}>
          {driver.driver_name}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{driver.teams?.team_name}</div>
      </div>
      <div className={`pr-4 ${isDragging ? 'text-red-600 opacity-100' : 'opacity-30'}`}>
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Iets grotere afstand om scrollen makkelijker te maken
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
    /* overflow-y-auto zorgt voor de scrollbaarheid */
    <div className="w-full max-w-md mx-auto h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(i => i.driver_id)} strategy={verticalListSortingStrategy}>
          <div className="pb-4">
            {items.map((driver, index) => (
              <SortableDriver key={driver.driver_id} driver={driver} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* De knop staat nu buiten de DndContext maar binnen de scroll-container of eronder */}
      <div className="sticky bottom-0 bg-[#0b0e14] pt-4 pb-8">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full bg-red-600 text-white font-black italic uppercase py-4 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all ${
            isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500 active:scale-95'
          }`}
        >
          {isSaving ? 'Bezig met opslaan...' : 'Sla Voorspelling Op'}
        </button>
      </div>
    </div>
  );
}