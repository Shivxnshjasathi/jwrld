'use client';

import { useState, useCallback, useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatTime, OPERATING_HOURS } from '@/lib/utils';

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
      onTimeChange(startTime, endTime - 1);
    }
  };

  const handleIncreaseDuration = () => {
    if (endTime < opEnd) {
      onTimeChange(startTime, endTime + 1);
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const clickedHour = Math.round(percentage * totalSlots + opStart);
    
    const newStart = Math.max(opStart, Math.min(clickedHour, opEnd - duration));
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
          onTimeChange(newStart, endTime);
        } else {
          const newEnd = Math.min(opEnd, Math.max(hour, startTime + 1));
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
    <div className="time-section">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-bold text-arcade-text tracking-wider">TIME</p>
          <p className="text-base font-semibold text-arcade-text mt-1">
            {formatTime(startTime)} - {formatTime(endTime === 24 ? 0 : endTime)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecreaseDuration}
            disabled={duration <= 1}
            className="w-8 h-8 rounded-full border-2 border-arcade-text-muted flex items-center justify-center disabled:opacity-30 transition-opacity"
          >
            <Minus size={14} className="text-arcade-text-muted" />
          </button>
          <span className="text-sm font-semibold text-arcade-text min-w-[60px] text-center">
            {duration * 60} Mins
          </span>
          <button
            onClick={handleIncreaseDuration}
            disabled={endTime >= opEnd}
            className="w-8 h-8 rounded-full border-2 border-arcade-text-muted flex items-center justify-center disabled:opacity-30 transition-opacity"
          >
            <Plus size={14} className="text-arcade-text-muted" />
          </button>
        </div>
      </div>

      {/* Time labels */}
      <div className="relative mt-6 mb-2">
        <div className="flex justify-between px-1">
          {visibleLabels.map((item, i) => (
            <span key={i} className="text-[11px] font-medium text-arcade-text-muted">
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Slider track */}
      <div className="time-slider-track" onClick={handleTrackClick}>
        {/* Booked Blocks */}
        {bookedHours.map((hour) => {
          if (hour < opStart || hour >= opEnd) return null;
          const pos = ((hour - opStart) / totalSlots) * 100;
          const width = (1 / totalSlots) * 100;
          return (
            <div
              key={hour}
              className="absolute h-full bg-red-400 opacity-60 pointer-events-none"
              style={{ left: `${pos}%`, width: `${width}%` }}
            />
          );
        })}

        <div
          className="time-slider-fill"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <div
          className="time-slider-thumb"
          style={{ left: `${fillLeft}%` }}
          onMouseDown={handleThumbDrag('start')}
          onTouchStart={handleThumbDrag('start')}
        />
        <div
          className="time-slider-thumb"
          style={{ left: `${fillLeft + fillWidth}%` }}
          onMouseDown={handleThumbDrag('end')}
          onTouchStart={handleThumbDrag('end')}
        />
      </div>

      {/* Triangle indicators */}
      <div className="relative h-6 mt-1">
        <div
          className="absolute transition-all duration-150"
          style={{ left: `${fillLeft}%`, transform: 'translateX(-50%)' }}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" className="text-arcade-text">
            <polygon points="6,0 0,8 12,8" fill="currentColor" />
          </svg>
        </div>
        <div
          className="absolute transition-all duration-150"
          style={{ left: `${fillLeft + fillWidth}%`, transform: 'translateX(-50%)' }}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" className="text-arcade-text">
            <polygon points="6,0 0,8 12,8" fill="currentColor" />
          </svg>
        </div>
        {/* Line between triangles */}
        <div
          className="absolute top-[3px] h-[2px] bg-arcade-text transition-all duration-150"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
      </div>
    </div>
  );
}
