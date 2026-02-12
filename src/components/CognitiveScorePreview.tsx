'use client';

import { PlanBlock, CognitiveLevel } from '@/lib/types';

interface CognitiveScorePreviewProps {
  planBlocks: PlanBlock[];
  totalTimeLimit: number;
}

const COGNITIVE_COLORS: Record<CognitiveLevel, string> = {
  none: '#e0e7ff',
  low: '#d1fae5',
  medium: '#fef3c7',
  high: '#fee2e2',
  story: '#dbeafe',
  break: '#cbd5e1',
};

const COGNITIVE_HEIGHTS: Record<CognitiveLevel, string> = {
  none: '50%',
  low: '30%',
  medium: '60%',
  high: '90%',
  story: '10%',
  break: '5%',
};

const COGNITIVE_LABELS: Record<CognitiveLevel, string> = {
  none: '미설정',
  low: '낮음',
  medium: '보통',
  high: '높음',
  story: '썰',
  break: '휴식',
};

const LEGEND_ITEMS: { level: CognitiveLevel; label: string }[] = [
  { level: 'low', label: '낮음 (복습/도입)' },
  { level: 'medium', label: '보통 (설명/연습)' },
  { level: 'high', label: '높음 (핵심/활동)' },
  { level: 'story', label: '썰/여담' },
  { level: 'break', label: '쉬는 시간' },
];

export default function CognitiveScorePreview({
  planBlocks,
  totalTimeLimit,
}: CognitiveScorePreviewProps) {
  if (planBlocks.length === 0) return null;

  return (
    <div className="cognitive-score-preview">
      <div className="cognitive-score-title">
        <span>🎼</span> 인지 부하 악보 미리보기
      </div>
      <div className="cognitive-graph">
        {planBlocks.map((block) => {
          const widthPercent = Math.max(
            (block.minutes / totalTimeLimit) * 100,
            3
          );
          return (
            <div
              key={block.id}
              className="cognitive-bar"
              style={{
                width: `${widthPercent}%`,
                height: COGNITIVE_HEIGHTS[block.cognitiveLevel],
                backgroundColor: COGNITIVE_COLORS[block.cognitiveLevel],
              }}
              title={`${block.title || '(제목 없음)'} - ${block.minutes}분 - ${COGNITIVE_LABELS[block.cognitiveLevel]}`}
            >
              <span className="cognitive-bar-label">
                {block.minutes}m
              </span>
            </div>
          );
        })}
      </div>
      <div className="cognitive-legend">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.level} className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: COGNITIVE_COLORS[item.level] }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
