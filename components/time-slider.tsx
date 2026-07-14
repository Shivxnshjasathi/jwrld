'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { formatTime, OPERATING_HOURS } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

interface TimeSliderProps {
  startTime: number;
  endTime: number;
  bookedHours?: number[];
  onTimeChange: (start: number, end: number) => void;
}

export default function TimeSlider({ startTime, endTime, bookedHours = [], onTimeChange }: TimeSliderProps) {
  const { start: opStart, end: opEnd } = OPERATING_HOURS;
  const totalSlots = opEnd - opStart;
  const duration = endTime - startTime;
  const { playTap } = useSound();
  const lastPlayedTimeRef = useRef<{start: number, end: number}>({start: startTime, end: endTime});

  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    for (let h = opStart; h <= opEnd; h += 1) {
      if (h <= 24) labels.push(formatTime(h === 24 ? 0 : h));
    }
    return labels;
  }, [opStart, opEnd]);

  // Show subset of labels for display
  const visibleLabels = useMemo(() => {
    const step = Math.max(1, Math.floor(totalSlots / 5));
    const result: { label: string; position: number }[] = [];
    for (let i = 0; i <= totalSlots; i += step) {
      result.push({
        label: timeLabels[i] || '',
        position: (i / totalSlots) * 100,
      });
    }
    return result;
  }, [timeLabels, totalSlots]);

  const fillLeft = ((startTime - opStart) / totalSlots) * 100;
  const fillWidth = (duration / totalSlots) * 100;

  const handleDecreaseDuration = () => {
    if (duration > 1) {
      playTap();
      onTimeChange(startTime, endTime - 1);
    }
  };

  const handleIncreaseDuration = () => {
    if (endTime < opEnd) {
      playTap();
      onTimeChange(startTime, endTime + 1);
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const clickedHour = Math.round(percentage * totalSlots + opStart);
    
    const newStart = Math.max(opStart, Math.min(clickedHour, opEnd - duration));
    if (newStart !== startTime) playTap();
    onTimeChange(newStart, newStart + duration);
  };

  const handleThumbDrag = useCallback(
    (type: 'start' | 'end') => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const track = (e.currentTarget as HTMLElement).parentElement;
      if (!track) return;

      const move = (clientX: number) => {
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const hour = Math.round(percentage * totalSlots + opStart);

        if (type === 'start') {
          const newStart = Math.max(opStart, Math.min(hour, endTime - 1));
          if (newStart !== lastPlayedTimeRef.current.start) {
            playTap();
            lastPlayedTimeRef.current = { start: newStart, end: endTime };
          }
          onTimeChange(newStart, endTime);
        } else {
          const newEnd = Math.min(opEnd, Math.max(hour, startTime + 1));
          if (newEnd !== lastPlayedTimeRef.current.end) {
            playTap();
            lastPlayedTimeRef.current = { start: startTime, end: newEnd };
          }
          onTimeChange(startTime, newEnd);
        }
      };

      const handleMouseMove = (ev: MouseEvent) => move(ev.clientX);
      const handleTouchMove = (ev: TouchEvent) => move(ev.touches[0].clientX);

      const cleanup = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', cleanup);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', cleanup);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', cleanup);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', cleanup);
    },
    [startTime, endTime, totalSlots, opStart, opEnd, onTimeChange]
  );

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[12px] font-bold text-on-surface-variant tracking-wider">TIME</p>
          <p className="text-[16px] font-bold text-primary mt-1">
            {formatTime(startTime)} - {formatTime(endTime === 24 ? 0 : endTime)}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-high rounded-full p-1 border border-white/5">
          <button
            onClick={handleDecreaseDuration}
            disabled={duration <= 1}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <span className="text-[14px] font-bold text-on-surface min-w-[60px] text-center">
            {duration * 60}m
          </span>
          <button
            onClick={handleIncreaseDuration}
            disabled={endTime >= opEnd}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>

      {/* Time labels */}
      <div className="relative mt-8 mb-3">
        <div className="flex justify-between px-1">
          {visibleLabels.map((item, i) => (
            <span key={i} className="text-[10px] font-medium text-on-surface-variant">
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Slider track */}
      <div 
        className="relative h-2 bg-surface-container-highest rounded-full cursor-pointer overflow-hidden border border-white/5" 
        onClick={handleTrackClick}
      >
        {/* Booked Blocks */}
        {bookedHours.map((hour) => {
          if (hour < opStart || hour >= opEnd) return null;
          const pos = ((hour - opStart) / totalSlots) * 100;
          const width = (1 / totalSlots) * 100;
          return (
            <div
              key={hour}
              className="absolute h-full bg-red-500/50 pointer-events-none"
              style={{ left: `${pos}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Selected Range Fill */}
        <div
          className="absolute h-full bg-gradient-to-r from-primary to-secondary pointer-events-none neon-glow-primary"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        
        {/* Start Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(221,183,255,0.8)] cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${fillLeft}%` }}
          onMouseDown={handleThumbDrag('start')}
          onTouchStart={handleThumbDrag('start')}
        />
        
        {/* End Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-background border-2 border-secondary shadow-[0_0_10px_rgba(68,226,205,0.8)] cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${fillLeft + fillWidth}%` }}
          onMouseDown={handleThumbDrag('end')}
          onTouchStart={handleThumbDrag('end')}
        />
      </div>
    </div>
  );
}
