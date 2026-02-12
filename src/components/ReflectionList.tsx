'use client';

import { Reflection } from '@/lib/types';

interface ReflectionListProps {
  reflections: Reflection[];
  onDelete: (id: number) => void;
}

export default function ReflectionList({
  reflections,
  onDelete,
}: ReflectionListProps) {
  if (reflections.length === 0) {
    return (
      <div className="empty-state">
        <p style={{ fontSize: '48px', marginBottom: '15px' }}>📝</p>
        <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          저장된 회고가 없습니다
        </p>
        <p>새 회고 작성 탭에서 수업 회고를 작성해보세요.</p>
      </div>
    );
  }

  return (
    <div>
      {reflections.map((reflection) => {
        const totalPlanned = reflection.planBlocks.reduce(
          (sum, b) => sum + b.minutes,
          0
        );
        const totalActual = reflection.actualBlocks.reduce(
          (sum, b) => sum + b.actualMinutes,
          0
        );

        return (
          <div key={reflection.id} className="reflection-card">
            <div className="reflection-header">
              <span className="reflection-title">
                {reflection.courseTitle || '(제목 없음)'}
                {reflection.sessionNumber
                  ? ` - ${reflection.sessionNumber}차시`
                  : ''}
              </span>
              <span className="reflection-date">
                {reflection.date || reflection.createdAt.split('T')[0]}
              </span>
            </div>
            <div className="reflection-stats">
              <span>📚 구간: {reflection.planBlocks.length}개</span>
              <span>⏱️ 계획: {totalPlanned}분</span>
              {reflection.actualBlocks.length > 0 && (
                <span>
                  🎯 실제: {totalActual}분 (
                  {totalActual - totalPlanned > 0 ? '+' : ''}
                  {totalActual - totalPlanned}분)
                </span>
              )}
              <span>
                ⏰ 총 시간: {reflection.totalTimeLimit}분
              </span>
            </div>
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('이 회고를 삭제하시겠습니까?')) {
                    onDelete(reflection.id);
                  }
                }}
                style={{
                  background: '#fc8181',
                  color: 'white',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
