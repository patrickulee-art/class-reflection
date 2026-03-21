'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useReflectionsContext } from '@/contexts/ReflectionsContext';
import { Reflection } from '@/lib/types';

const EDIT_REFLECTION_KEY = 'edit_reflection_id';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatSavedAt(createdAt: string): string {
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}년 ${mm}월 ${dd}일 ${hh}:${min}(${day})에 저장`;
}

function ReflectionStats({ reflection }: { reflection: Reflection }) {
  const blocks = reflection.planBlocks || [];
  const actuals = reflection.actualBlocks || [];
  const totalPlanned = blocks.reduce((sum, b) => sum + (b.minutes || 0), 0);
  const totalActual = actuals.reduce((sum, b) => sum + (b.actualMinutes || 0), 0);
  const hasActuals = actuals.length > 0;
  const diff = totalActual - totalPlanned;
  const diffSign = diff > 0 ? '+' : '';

  return (
    <div className="reflection-stats">
      <span>{'📚'} 구간: {blocks.length}개</span>
      <span>{'⏱️'} 계획: {totalPlanned}분</span>
      {hasActuals && (
        <span>{'🎯'} 실제: {totalActual}분 ({diffSign}{diff}분)</span>
      )}
      <span>{'⏰'} 총 시간: {reflection.totalTimeLimit}분</span>
    </div>
  );
}

export default function ReflectionsPage() {
  const { reflections, deleteReflection } = useReflectionsContext();
  const router = useRouter();

  const handleEdit = useCallback((reflection: Reflection) => {
    localStorage.setItem(EDIT_REFLECTION_KEY, String(reflection.id));
    router.push('/write');
  }, [router]);

  const handleDelete = useCallback((id: number) => {
    if (window.confirm('이 회고를 삭제하시겠습니까?')) {
      deleteReflection(id);
    }
  }, [deleteReflection]);

  return (
    <div className="reflections-page">
      <div className="page-header">
        <h2>회고 목록 ({reflections.length})</h2>
      </div>

      <div className="content">
        {reflections.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '48px', marginBottom: '15px' }}>{'📝'}</p>
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              저장된 회고가 없습니다
            </p>
            <p>새 회고 작성 탭에서 수업 회고를 작성해보세요.</p>
          </div>
        ) : (
          <div>
            {reflections.map((reflection) => (
              <div
                key={reflection.id}
                className="reflection-card"
                onClick={() => router.push(`/reflections/${reflection.id}`)}
              >
                <div className="reflection-header">
                  <span className="reflection-title">
                    {reflection.courseTitle || '(제목 없음)'}
                    {reflection.sessionNumber
                      ? ` - ${reflection.sessionNumber}`
                      : ''}
                  </span>
                  <span className="reflection-date">
                    {formatSavedAt(reflection.createdAt)}
                  </span>
                </div>
                <ReflectionStats reflection={reflection} />
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(reflection);
                    }}
                    style={{
                      background: '#6366F1',
                      color: 'white',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    편집
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(reflection.id);
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
