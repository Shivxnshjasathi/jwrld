'use client';

import { useRef, useCallback, useState } from 'react';
import { useSound } from '@/hooks/use-sound';

const MIN_HOUR = 10;
const MAX_HOUR = 21;
const RANGE = MAX_HOUR - MIN_HOUR; // 11

interface SliderTrackProps {
  startTime: number;
  endTime: number;
  bookedHours: number[];
  pastHours?: number[];
  onRangeChange: (start: number, end: number) => void;
}

export default function SliderTrack({ startTime, endTime, bookedHours, pastHours = [], onRangeChange }: SliderTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | 'range' | null>(null);
  const dragRef = useRef<{ x: number; startTime: number; endTime: number }>({ x: 0, startTime: 10, endTime: 11 });
  const { playTap } = useSound();
  const lastTapRef = useRef<{start: number, end: number}>({start: startTime, end: endTime});

  const handleRangeChange = useCallback((newStart: number, newEnd: number) => {
    if (newStart !== lastTapRef.current.start || newEnd !== lastTapRef.current.end) {
      playTap();
      lastTapRef.current = { start: newStart, end: newEnd };
    }
    onRangeChange(newStart, newEnd);
  }, [onRangeChange, playTap]);

  const getHourFromX = useCallback((clientX: number): number => {
    if (!trackRef.current) return MIN_HOUR;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(MIN_HOUR + pct * RANGE);
  }, []);

  const moveDrag = useCallback((clientX: number) => {
    if (!dragging) return;
    const dur = dragRef.current.endTime - dragRef.current.startTime;
    const hour = getHourFromX(clientX);
    
    if (dragging === 'start') {
      const newStart = Math.min(hour, endTime - 1);
      const clamped = Math.max(MIN_HOUR, Math.min(MAX_HOUR - 1, newStart));
      handleRangeChange(clamped, Math.max(clamped + 1, endTime));
    } else if (dragging === 'end') {
      const newEnd = Math.max(hour, startTime + 1);
      const clamped = Math.max(MIN_HOUR + 1, Math.min(MAX_HOUR, newEnd));
      handleRangeChange(Math.min(startTime, clamped - 1), clamped);
    } else {
      const delta = hour - getHourFromX(dragRef.current.x);
      let newStart = dragRef.current.startTime + delta;
      let newEnd = newStart + dur;
      if (newStart < MIN_HOUR) { newStart = MIN_HOUR; newEnd = newStart + dur; }
      if (newEnd > MAX_HOUR) { newEnd = MAX_HOUR; newStart = newEnd - dur; }
      handleRangeChange(newStart, newEnd);
    }
  }, [dragging, startTime, endTime, getHourFromX, handleRangeChange]);

  const endDrag = useCallback(() => setDragging(null), []);

  // Tap on track to jump
  const handleTrackTap = useCallback((clientX: number) => {
    const hour = getHourFromX(clientX);
    const dur = endTime - startTime;
    let newStart = Math.round(hour - dur / 2);
    if (newStart < MIN_HOUR) newStart = MIN_HOUR;
    if (newStart + dur > MAX_HOUR) newStart = MAX_HOUR - dur;
    handleRangeChange(newStart, newStart + dur);
  }, [startTime, endTime, getHourFromX, handleRangeChange]);

  const startPct = ((startTime - MIN_HOUR) / RANGE) * 100;
  const widthPct = ((endTime - startTime) / RANGE) * 100;

  return (
    <div className="relative pt-6 pb-12 px-2 select-none">
      {/* Tick labels */}
      <div className="absolute top-0 left-[16px] right-[16px] flex justify-between pointer-events-none">
        {[10, 12, 14, 16, 18, 20].map(h => {
          const percent = ((h - MIN_HOUR) / RANGE) * 100;
          return (
            <div key={h} className="absolute flex flex-col items-center -translate-x-1/2" style={{ left: `${percent}%` }}>
              <span className="text-[10px] font-bold text-on-surface-variant/70 mb-2 whitespace-nowrap tracking-wider">
                {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
              </span>
              <div className="w-[1.5px] h-1.5 bg-white/10 rounded-full" />
            </div>
          );
        })}
      </div>

      {/* Track line */}
      <div
        ref={trackRef}
        className="absolute top-[48px] left-[16px] right-[16px] h-2 bg-black/40 rounded-full border border-white/5 cursor-pointer"
        onClick={(e) => handleTrackTap(e.clientX)}
      >
        {/* Past (grey) segments */}
        {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(h => {
          if (pastHours.includes(h) && !bookedHours.includes(h)) {
            return (
              <div
                key={`past-${h}`}
                className="absolute top-0 h-full bg-surface-variant pointer-events-none opacity-60"
                style={{
                  left: `${((h - MIN_HOUR) / RANGE) * 100}%`,
                  width: `${(1 / RANGE) * 100}%`
                }}
              />
            );
          }
          return null;
        })}

        {/* Booked (red) segments */}
        {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(h => {
          if (bookedHours.includes(h)) {
            return (
              <div
                key={h}
                className="absolute top-0 h-full bg-error pointer-events-none opacity-50"
                style={{
                  left: `${((h - MIN_HOUR) / RANGE) * 100}%`,
                  width: `${(1 / RANGE) * 100}%`
                }}
              />
            );
          }
          return null;
        })}

        {/* Selected range — neon glow bar */}
        <div
          className="absolute top-0 h-full bg-secondary rounded-full transition-all duration-150 shadow-[0_0_15px_rgba(45,212,191,0.8)]"
          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
        />



        {/* Start handle (neon circle) */}
        <div
          className="absolute top-[4px] w-[30px] h-[30px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 touch-none cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          style={{ left: `${startPct}%` }}
          onTouchStart={(e) => {
            setDragging('start');
            dragRef.current = { x: e.touches[0].clientX, startTime, endTime };
          }}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
          onMouseDown={(e) => {
            setDragging('start');
            dragRef.current = { x: e.clientX, startTime, endTime };
            const onMove = (me: MouseEvent) => moveDrag(me.clientX);
            const onUp = () => { endDrag(); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        >
          {/* Visual Circle */}
          <div className="w-5 h-5 rounded-full bg-black border-[1.5px] border-secondary shadow-[0_0_15px_rgba(45,212,191,0.9)] pointer-events-none" />
        </div>

        {/* End handle (neon circle) */}
        <div
          className="absolute top-[4px] w-[30px] h-[30px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 touch-none cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          style={{ left: `${startPct + widthPct}%` }}
          onTouchStart={(e) => {
            setDragging('end');
            dragRef.current = { x: e.touches[0].clientX, startTime, endTime };
          }}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
          onMouseDown={(e) => {
            setDragging('end');
            dragRef.current = { x: e.clientX, startTime, endTime };
            const onMove = (me: MouseEvent) => moveDrag(me.clientX);
            const onUp = () => { endDrag(); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        >
          {/* Visual Circle */}
          <div className="w-5 h-5 rounded-full bg-black border-[1.5px] border-secondary shadow-[0_0_15px_rgba(45,212,191,0.9)] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
