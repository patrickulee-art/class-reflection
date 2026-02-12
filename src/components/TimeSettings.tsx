'use client';

import { PlanBlock } from '@/lib/types';

interface TimeSettingsProps {
  totalTimeLimit: number;
  planBlocks: PlanBlock[];
  onTotalTimeLimitChange: (value: number) => void;
}

const TIME_OPTIONS = [
  40, 50, 60, 75, 80, 90, 100, 110, 120, 135, 150, 160, 170, 180, 210, 240,
];

export default function TimeSettings({
  totalTimeLimit,
  planBlocks,
  onTotalTimeLimitChange,
}: TimeSettingsProps) {
  const totalPlanned = planBlocks.reduce((sum, b) => sum + b.minutes, 0);
  const isOver = totalPlanned > totalTimeLimit;
  const isCustom = !TIME_OPTIONS.includes(totalTimeLimit);

  return (
    <div className="time-settings">
      <span style={{ fontWeight: 600, color: '#6B7280' }}>총 수업 시간</span>
      <select
        value={isCustom ? 'custom' : totalTimeLimit}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'custom') return;
          onTotalTimeLimitChange(Number(val));
        }}
      >
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}분 ({(t / 60).toFixed(1)}시간)
          </option>
        ))}
        <option value="custom">직접 입력</option>
      </select>
      {isCustom && (
        <input
          type="number"
          value={totalTimeLimit}
          onChange={(e) => onTotalTimeLimitChange(Number(e.target.value) || 10)}
          style={{ width: '80px', textAlign: 'center', fontWeight: 600 }}
          min={10}
          max={600}
        />
      )}
      <div className="time-display">
        {totalPlanned} / {totalTimeLimit}분
      </div>
      {isOver ? (
        <span className="time-warning">
          {totalPlanned - totalTimeLimit}분 초과
        </span>
      ) : (
        <span className="time-ok">
          {totalTimeLimit - totalPlanned}분 여유
        </span>
      )}
    </div>
  );
}
