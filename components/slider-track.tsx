'use client';

import { useRef, useCallback, useState } from 'react';

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
  const dragRef = useRef<{ x: number; startTime: number; endTime: number }>({ x: 0, startTime: 10, endTime: 11 });

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
      onRangeChange(clamped, Math.max(clamped + 1, endTime));
    } else if (dragging === 'end') {
      const newEnd = Math.max(hour, startTime + 1);
      const clamped = Math.max(MIN_HOUR + 1, Math.min(MAX_HOUR, newEnd));
      onRangeChange(Math.min(startTime, clamped - 1), clamped);
    } else {
      const delta = hour - getHourFromX(dragRef.current.x);
      let newStart = dragRef.current.startTime + delta;
      let newEnd = newStart + dur;
      if (newStart < MIN_HOUR) { newStart = MIN_HOUR; newEnd = newStart + dur; }
      if (newEnd > MAX_HOUR) { newEnd = MAX_HOUR; newStart = newEnd - dur; }
      onRangeChange(newStart, newEnd);
    }
  }, [dragging, startTime, endTime, getHourFromX, onRangeChange]);

  const endDrag = useCallback(() => setDragging(null), []);

  // Tap on track to jump
  const handleTrackTap = useCallback((clientX: number) => {
    const hour = getHourFromX(clientX);
    const dur = endTime - startTime;
    let newStart = Math.round(hour - dur / 2);
    if (newStart < MIN_HOUR) newStart = MIN_HOUR;
    if (newStart + dur > MAX_HOUR) newStart = MAX_HOUR - dur;
    onRangeChange(newStart, newStart + dur);
  }, [startTime, endTime, getHourFromX, onRangeChange]);

  const startPct = ((startTime - MIN_HOUR) / RANGE) * 100;
  const widthPct = ((endTime - startTime) / RANGE) * 100;

  return (
    <div className="relative pt-2 pb-10 px-1 select-none">
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

      {/* Track line */}
      <div
        ref={trackRef}
        className="absolute top-[32px] left-[12px] right-[12px] h-[3px] bg-gray-200 rounded-full"
        onClick={(e) => handleTrackTap(e.clientX)}
      >
        {/* Booked (red) segments */}
        {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(h => {
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

        {/* Selected range — thin black bar */}
        <div
          className="absolute top-0 h-full bg-[#111111] rounded-full transition-all duration-150"
          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
        />

        {/* Draggable center area (slides the whole range) */}
        <div
          className="absolute top-[-20px] h-[40px] z-10 touch-none cursor-grab"
          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
          onTouchStart={(e) => {
            setDragging('range');
            dragRef.current = { x: e.touches[0].clientX, startTime, endTime };
          }}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
          onMouseDown={(e) => {
            setDragging('range');
            dragRef.current = { x: e.clientX, startTime, endTime };
            const onMove = (me: MouseEvent) => moveDrag(me.clientX);
            const onUp = () => { endDrag(); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        />

        {/* Start handle (left triangle) */}
        <div
          className="absolute top-[6px] w-[40px] h-[40px] -translate-x-1/2 -translate-y-[15px] flex items-center justify-center z-20 touch-none cursor-grab"
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
          {/* Visual Triangle */}
          <div className="absolute top-[15px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#111111] pointer-events-none" />
        </div>

        {/* End handle (right triangle) */}
        <div
          className="absolute top-[6px] w-[40px] h-[40px] -translate-x-1/2 -translate-y-[15px] flex items-center justify-center z-20 touch-none cursor-grab"
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
          {/* Visual Triangle */}
          <div className="absolute top-[15px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#111111] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
