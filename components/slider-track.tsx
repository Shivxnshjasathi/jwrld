'use client';

import { useRef, useCallback, useState } from 'react';

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const MIN_HOUR = 10;
const MAX_HOUR = 21;
const RANGE = MAX_HOUR - MIN_HOUR; // 11

interface SliderTrackProps {
  startTime: number;
  endTime: number;
  bookedHours: number[];
  onRangeChange: (start: number, end: number) => void;
}

export default function SliderTrack({ startTime, endTime, bookedHours, onRangeChange }: SliderTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | 'range' | null>(null);
  const dragStartRef = useRef<{ x: number; startTime: number; endTime: number }>({ x: 0, startTime: 10, endTime: 11 });

  const getHourFromX = useCallback((clientX: number): number => {
    if (!trackRef.current) return MIN_HOUR;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const hour = Math.round(MIN_HOUR + pct * RANGE);
    return Math.max(MIN_HOUR, Math.min(MAX_HOUR, hour));
  }, []);

  // ─── Handle Touch Start ─────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent, target: 'start' | 'end' | 'range') => {
    e.stopPropagation();
    const touch = e.touches[0];
    setDragging(target);
    dragStartRef.current = { x: touch.clientX, startTime, endTime };
  }, [startTime, endTime]);

  const handleMouseDown = useCallback((e: React.MouseEvent, target: 'start' | 'end' | 'range') => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(target);
    dragStartRef.current = { x: e.clientX, startTime, endTime };

    const handleMouseMove = (me: MouseEvent) => {
      const hour = getHourFromX(me.clientX);
      const dur = dragStartRef.current.endTime - dragStartRef.current.startTime;

      if (target === 'start') {
        const newStart = Math.min(hour, endTime - 1);
        const clamped = Math.max(MIN_HOUR, Math.min(MAX_HOUR - 1, newStart));
        onRangeChange(clamped, Math.max(clamped + 1, endTime));
      } else if (target === 'end') {
        const newEnd = Math.max(hour, startTime + 1);
        const clamped = Math.max(MIN_HOUR + 1, Math.min(MAX_HOUR, newEnd));
        onRangeChange(Math.min(startTime, clamped - 1), clamped);
      } else {
        const delta = hour - getHourFromX(dragStartRef.current.x);
        let newStart = dragStartRef.current.startTime + delta;
        let newEnd = newStart + dur;
        if (newStart < MIN_HOUR) { newStart = MIN_HOUR; newEnd = newStart + dur; }
        if (newEnd > MAX_HOUR) { newEnd = MAX_HOUR; newStart = newEnd - dur; }
        onRangeChange(newStart, newEnd);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [startTime, endTime, getHourFromX, onRangeChange]);

  // ─── Handle Touch Move ──────────────────────────────────────────────
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    const hour = getHourFromX(touch.clientX);
    const dur = dragStartRef.current.endTime - dragStartRef.current.startTime;

    if (dragging === 'start') {
      const newStart = Math.min(hour, endTime - 1);
      const clamped = Math.max(MIN_HOUR, Math.min(MAX_HOUR - 1, newStart));
      onRangeChange(clamped, Math.max(clamped + 1, endTime));
    } else if (dragging === 'end') {
      const newEnd = Math.max(hour, startTime + 1);
      const clamped = Math.max(MIN_HOUR + 1, Math.min(MAX_HOUR, newEnd));
      onRangeChange(Math.min(startTime, clamped - 1), clamped);
    } else {
      const delta = hour - getHourFromX(dragStartRef.current.x);
      let newStart = dragStartRef.current.startTime + delta;
      let newEnd = newStart + dur;
      if (newStart < MIN_HOUR) { newStart = MIN_HOUR; newEnd = newStart + dur; }
      if (newEnd > MAX_HOUR) { newEnd = MAX_HOUR; newStart = newEnd - dur; }
      onRangeChange(newStart, newEnd);
    }
  }, [dragging, startTime, endTime, getHourFromX, onRangeChange]);

  const handleTouchEnd = useCallback(() => {
    setDragging(null);
  }, []);

  // ─── Tap on track to move selection ─────────────────────────────────
  const handleTrackTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const hour = getHourFromX(clientX);
    const dur = endTime - startTime;
    let newStart = Math.round(hour - dur / 2);
    if (newStart < MIN_HOUR) newStart = MIN_HOUR;
    if (newStart + dur > MAX_HOUR) newStart = MAX_HOUR - dur;
    onRangeChange(newStart, newStart + dur);
  }, [startTime, endTime, getHourFromX, onRangeChange]);

  const startPct = ((startTime - MIN_HOUR) / RANGE) * 100;
  const endPct = ((endTime - MIN_HOUR) / RANGE) * 100;

  return (
    <div className="relative pt-2 pb-12 px-1 select-none touch-none">
      {/* Tick labels */}
      <div className="absolute top-0 left-[12px] right-[12px] flex justify-between pointer-events-none">
        {[10, 12, 14, 16, 18, 20].map(h => {
          const percent = ((h - MIN_HOUR) / RANGE) * 100;
          return (
            <div key={h} className="absolute flex flex-col items-center -translate-x-1/2" style={{ left: `${percent}%` }}>
              <span className="text-[10px] font-bold text-gray-400 mb-2 whitespace-nowrap">
                {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
              </span>
              <div className="w-[1.5px] h-1.5 bg-gray-300 rounded-full" />
            </div>
          );
        })}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="absolute top-[32px] left-[12px] right-[12px] h-[3px] bg-gray-200 rounded-full cursor-pointer"
        onClick={handleTrackTap}
      >
        {/* Booked segments */}
        {HOURS.map(h => {
          if (bookedHours.includes(h)) {
            return (
              <div
                key={h}
                className="absolute top-0 h-full bg-red-500 pointer-events-none"
                style={{
                  left: `${((h - MIN_HOUR) / RANGE) * 100}%`,
                  width: `${(1 / RANGE) * 100}%`
                }}
              />
            );
          }
          return null;
        })}

        {/* Selected range bar — draggable */}
        <div
          className={`absolute top-[-8px] h-[19px] bg-[#111111] rounded-full cursor-grab transition-colors ${dragging === 'range' ? 'bg-[#333]' : ''}`}
          style={{
            left: `${startPct}%`,
            width: `${endPct - startPct}%`,
          }}
          onTouchStart={(e) => handleTouchStart(e, 'range')}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => handleMouseDown(e, 'range')}
        />

        {/* Start handle — big touch target */}
        <div
          className={`absolute top-[-18px] w-[44px] h-[44px] flex items-center justify-center cursor-grab z-20 ${dragging === 'start' ? 'scale-125' : ''}`}
          style={{ left: `${startPct}%`, transform: 'translateX(-50%)' }}
          onTouchStart={(e) => handleTouchStart(e, 'start')}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="w-5 h-5 rounded-full bg-[#111111] border-[3px] border-white shadow-md" />
        </div>

        {/* End handle — big touch target */}
        <div
          className={`absolute top-[-18px] w-[44px] h-[44px] flex items-center justify-center cursor-grab z-20 ${dragging === 'end' ? 'scale-125' : ''}`}
          style={{ left: `${endPct}%`, transform: 'translateX(-50%)' }}
          onTouchStart={(e) => handleTouchStart(e, 'end')}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="w-5 h-5 rounded-full bg-[#111111] border-[3px] border-white shadow-md" />
        </div>
      </div>
    </div>
  );
}
