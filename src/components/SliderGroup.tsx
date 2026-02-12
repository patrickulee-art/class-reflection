'use client';

interface SliderGroupProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function SliderGroup({ label, value, onChange }: SliderGroupProps) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}</span>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min={1}
          max={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
        />
      </div>
      <div className="slider-marks">
        <span className="slider-mark">1</span>
        <span className="slider-mark">2</span>
        <span className="slider-mark">3</span>
        <span className="slider-mark">4</span>
        <span className="slider-mark">5</span>
      </div>
    </div>
  );
}
