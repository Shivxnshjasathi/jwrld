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
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-arcade-text tracking-wide">{currentMonth}</h3>
        <button className="p-1 text-arcade-text-muted hover:text-arcade-text transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="date-strip">
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`date-item ${isSelected ? 'selected' : ''} ${isTodayDate && !isSelected ? 'today' : ''}`}
            >
              <span className="day-label">{format(date, 'EEE')}</span>
              <span className="date-number">{format(date, 'd')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
