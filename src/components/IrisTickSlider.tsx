import React from 'react';

interface IrisTickSliderProps {
  value: number; // 0 to 100
  onChange?: (val: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  midLabel?: string;
  maxLabel?: string;
  totalTicks?: number;
  readOnly?: boolean;
}

export const IrisTickSlider: React.FC<IrisTickSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  minLabel = '0',
  midLabel = '50',
  maxLabel = '100',
  totalTicks = 22,
  readOnly = false
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const activeTickCount = Math.round((percentage / 100) * totalTicks);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
    const newVal = Math.round(min + (newPercent / 100) * (max - min));
    onChange(newVal);
  };

  return (
    <div className="w-full space-y-2 select-none">
      {/* Ticks Track & Active Thumb */}
      <div
        onClick={handleClick}
        className={`relative h-10 flex items-center justify-between px-1 ${
          readOnly ? '' : 'cursor-pointer group'
        }`}
      >
        {/* Array of Vertical Frosted Capsule Bars (Identical to the User Image) */}
        <div className="w-full flex items-center justify-between gap-1 sm:gap-1.5 h-7">
          {Array.from({ length: totalTicks }).map((_, i) => {
            const isActive = i <= activeTickCount;
            return (
              <div
                key={i}
                className={`flex-1 h-full rounded-full transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-800 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.4)] border border-zinc-900/10 dark:border-white/90 scale-y-100'
                    : 'bg-zinc-400/30 dark:bg-white/15 scale-y-90'
                }`}
              />
            );
          })}
        </div>

        {/* Sliding Frosted Capsule Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 sm:w-3 h-8 sm:h-9 bg-zinc-950 dark:bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.22)] border-2 border-white dark:border-zinc-800 pointer-events-none transition-all duration-150 ease-out"
          style={{
            left: `calc(${percentage}% - ${percentage > 95 ? 12 : percentage < 5 ? 2 : 6}px)`
          }}
        />
      </div>

      {/* Axis Scale Labels (0 · 50 · 100) */}
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-200 tracking-wide px-1 font-mono">
        <span>{minLabel}</span>
        <span>{midLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};
