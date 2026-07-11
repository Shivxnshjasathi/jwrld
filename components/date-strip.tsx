'use client';

import { useRef, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay, isToday } from 'date-fns';

interface DateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  daysToShow?: number;
}

export default function DateStrip({ selectedDate, onDateSelect, daysToShow = 14 }: DateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);

  const dates = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) => addDays(today, i));
  }, [today, daysToShow]);

  const currentMonth = format(selectedDate, 'MMMM yyyy').toUpperCase();

  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = dates.findIndex((d) => isSameDay(d, selectedDate));
      if (selectedIndex > -1) {
        const child = scrollRef.current.children[selectedIndex] as HTMLElement;
        if (child) {
          child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [selectedDate, dates]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[16px] font-bold text-on-surface tracking-wide">{currentMonth}</h3>
        <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x px-1">
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`flex flex-col items-center justify-center min-w-[72px] h-[90px] rounded-2xl shrink-0 snap-start transition-all ${
                isSelected
                  ? 'glass-card border border-primary/50 shadow-[0_0_15px_rgba(221,183,255,0.2)] text-primary scale-105'
                  : isTodayDate
                  ? 'glass-panel border border-secondary/30 text-secondary'
                  : 'glass-panel border border-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`text-[12px] font-bold tracking-widest uppercase mb-1 ${isSelected ? 'text-primary' : isTodayDate ? 'text-secondary/80' : 'text-on-surface-variant'}`}>
                {format(date, 'EEE')}
              </span>
              <span className={`text-[28px] font-display-md font-bold leading-none ${isSelected ? 'text-white drop-shadow-[0_0_8px_rgba(221,183,255,0.8)]' : isTodayDate ? 'text-secondary' : 'text-on-surface'}`}>
                {format(date, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
