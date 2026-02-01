
import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (val: number) => string;
}

const Slider: React.FC<SliderProps> = ({ 
  label, 
  value, 
  onChange, 
  onStart,
  onEnd,
  min, 
  max, 
  step = 0.01,
  formatValue
}) => {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-primary italic">
            {formatValue ? formatValue(value) : Math.round(value * 100) + '%'}
        </span>
      </div>
      <div className="relative w-full h-6 flex items-center">
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            onPointerDown={onStart}
            onPointerUp={onEnd}
            onPointerLeave={onEnd}
            className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary hover:accent-secondary transition-all"
        />
      </div>
    </div>
  );
};

export default Slider;
