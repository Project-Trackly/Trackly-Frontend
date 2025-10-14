'use client';

import { useCallback, useMemo } from 'react';
import { use3DViewStore } from '@/stores/3d-view-store';

interface TimeSliderProps {
  /** Range of dates to allow in slider (in days from now) */
  minDays?: number;
  maxDays?: number;
  /** Callback when time range changes */
  onChange?: (range: { start: Date; end: Date }) => void;
}

/**
 * TimeSlider Component
 * 
 * Interactive time range selector for timeline mode.
 * Allows users to navigate through past and future time periods.
 * Updates camera position to focus on selected time range.
 * 
 * @component
 * @example
 * ```tsx
 * <TimeSlider minDays={-60} maxDays={60} />
 * ```
 */
export function TimeSlider({
  minDays = -60,
  maxDays = 60,
  onChange,
}: TimeSliderProps) {
  const { selectedTimeRange, setSelectedTimeRange } = use3DViewStore();

  // Convert days to dates
  const dateRange = useMemo(() => {
    const now = new Date();
    const minDate = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
    return { minDate, maxDate };
  }, [minDays, maxDays]);

  // Convert current selection to slider values (0-100)
  const sliderValue = useMemo(() => {
    if (!selectedTimeRange) {
      return { start: 40, end: 60 }; // Default: 20 days around now
    }

    const { minDate, maxDate } = dateRange;
    const totalRange = maxDate.getTime() - minDate.getTime();

    const startPercent =
      ((selectedTimeRange.start.getTime() - minDate.getTime()) / totalRange) * 100;
    const endPercent =
      ((selectedTimeRange.end.getTime() - minDate.getTime()) / totalRange) * 100;

    return {
      start: Math.max(0, Math.min(100, startPercent)),
      end: Math.max(0, Math.min(100, endPercent)),
    };
  }, [selectedTimeRange, dateRange]);

  // Handle slider change
  const handleStartChange = useCallback(
    (value: number) => {
      const { minDate, maxDate } = dateRange;
      const totalRange = maxDate.getTime() - minDate.getTime();

      const startTime = minDate.getTime() + (value / 100) * totalRange;
      const endTime = selectedTimeRange
        ? selectedTimeRange.end.getTime()
        : minDate.getTime() + (sliderValue.end / 100) * totalRange;

      // Ensure start < end
      if (startTime < endTime) {
        const newRange = {
          start: new Date(startTime),
          end: new Date(endTime),
        };
        setSelectedTimeRange(newRange);
        onChange?.(newRange);
      }
    },
    [dateRange, selectedTimeRange, sliderValue.end, setSelectedTimeRange, onChange]
  );

  const handleEndChange = useCallback(
    (value: number) => {
      const { minDate, maxDate } = dateRange;
      const totalRange = maxDate.getTime() - minDate.getTime();

      const startTime = selectedTimeRange
        ? selectedTimeRange.start.getTime()
        : minDate.getTime() + (sliderValue.start / 100) * totalRange;
      const endTime = minDate.getTime() + (value / 100) * totalRange;

      // Ensure start < end
      if (startTime < endTime) {
        const newRange = {
          start: new Date(startTime),
          end: new Date(endTime),
        };
        setSelectedTimeRange(newRange);
        onChange?.(newRange);
      }
    },
    [dateRange, selectedTimeRange, sliderValue.start, setSelectedTimeRange, onChange]
  );

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.round((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';

    const isPast = diffDays < 0;
    const absDays = Math.abs(diffDays);

    if (absDays < 7) {
      return `${absDays}일 ${isPast ? '전' : '후'}`;
    } else if (absDays < 30) {
      const weeks = Math.round(absDays / 7);
      return `${weeks}주 ${isPast ? '전' : '후'}`;
    } else {
      const months = Math.round(absDays / 30);
      return `${months}개월 ${isPast ? '전' : '후'}`;
    }
  };

  const startLabel = selectedTimeRange ? formatDate(selectedTimeRange.start) : '시작';
  const endLabel = selectedTimeRange ? formatDate(selectedTimeRange.end) : '종료';

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-96 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">시간 범위 선택</h3>
          <button
            onClick={() => {
              setSelectedTimeRange(null);
              onChange?.(null as any);
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            초기화
          </button>
        </div>

        {/* Range Display */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-medium">{startLabel}</span>
          <span className="text-gray-400">~</span>
          <span className="font-medium">{endLabel}</span>
        </div>

        {/* Dual Range Slider */}
        <div className="relative h-8">
          {/* Track */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full -translate-y-1/2" />

          {/* Active Range */}
          <div
            className="absolute top-1/2 h-2 bg-blue-500 rounded-full -translate-y-1/2"
            style={{
              left: `${sliderValue.start}%`,
              width: `${sliderValue.end - sliderValue.start}%`,
            }}
          />

          {/* Start Handle */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderValue.start}
            onChange={(e) => handleStartChange(Number(e.target.value))}
            className="absolute top-0 left-0 w-full h-8 opacity-0 cursor-pointer z-10"
            aria-label="시작 날짜"
          />

          {/* End Handle */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderValue.end}
            onChange={(e) => handleEndChange(Number(e.target.value))}
            className="absolute top-0 left-0 w-full h-8 opacity-0 cursor-pointer z-20"
            aria-label="종료 날짜"
          />

          {/* Visual Handles */}
          <div
            className="absolute top-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md -translate-y-1/2 -translate-x-1/2 pointer-events-none z-30"
            style={{ left: `${sliderValue.start}%` }}
          />
          <div
            className="absolute top-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md -translate-y-1/2 -translate-x-1/2 pointer-events-none z-30"
            style={{ left: `${sliderValue.end}%` }}
          />
        </div>

        {/* Min/Max Labels */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(dateRange.minDate)}</span>
          <span>{formatDate(dateRange.maxDate)}</span>
        </div>

        {/* Keyboard Hint */}
        <p className="text-xs text-gray-500 text-center">
          드래그하여 시간 범위를 조정하세요
        </p>
      </div>
    </div>
  );
}
