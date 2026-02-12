'use client';

import { useState } from 'react';
import { Reflection, CognitiveLevel, DefaultEvals } from '@/lib/types';

interface ReflectionListProps {
  reflections: Reflection[];
  onDelete: (id: number) => void;
}

const COGNITIVE_LABELS: Record<CognitiveLevel, string> = {
  none: '없음',
  low: '낮음',
  medium: '보통',
  high: '높음',
  story: '썰/여담',
  break: '쉬는시간',
};

const COGNITIVE_COLORS: Record<CognitiveLevel, string> = {
  none: '#9CA3AF',
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  story: '#8B5CF6',
  break: '#6B7280',
};

const EVAL_LABELS: Record<keyof DefaultEvals, string> = {
  flow: '설명 흐름',
  kick: '도입 킥',
  humor: '유머/재미',
  nonverbal: '비언어적 표현',
  board: '판서',
};

function renderStars(rating: number, max: number = 5) {
  return (
    <span className="detail-stars">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={i < rating ? 'detail-star filled' : 'detail-star empty'}
        >
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

export default function ReflectionList({
  reflections,
  onDelete,
}: ReflectionListProps) {
  const [selectedReflection, setSelectedReflection] =
    useState<Reflection | null>(null);

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

  // Detail View
  if (selectedReflection) {
    const r = selectedReflection;
    const totalPlanned = r.planBlocks.reduce((sum, b) => sum + b.minutes, 0);
    const totalActual = r.actualBlocks.reduce(
      (sum, b) => sum + b.actualMinutes,
      0
    );
    const delta = totalActual - totalPlanned;

    return (
      <div className="detail-view">
        <button
          className="detail-back-btn"
          onClick={() => setSelectedReflection(null)}
        >
          ← 목록으로
        </button>

        {/* Header */}
        <div className="detail-header-card">
          <h2 className="detail-course-title">
            {r.courseTitle || '(제목 없음)'}
            {r.sessionNumber ? ` - ${r.sessionNumber}차시` : ''}
          </h2>
          <div className="detail-meta">
            <span>{r.date || r.createdAt.split('T')[0]}</span>
            {r.timeStart && r.timeEnd && (
              <span>
                {r.timeStart} ~ {r.timeEnd}
              </span>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="detail-stats-card">
          <div className="detail-stat-item">
            <span className="detail-stat-label">총 수업 시간</span>
            <span className="detail-stat-value">{r.totalTimeLimit}분</span>
          </div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">계획 시간</span>
            <span className="detail-stat-value">{totalPlanned}분</span>
          </div>
          {r.actualBlocks.length > 0 && (
            <div className="detail-stat-item">
              <span className="detail-stat-label">실제 시간</span>
              <span className="detail-stat-value">
                {totalActual}분{' '}
                <span
                  className={`detail-stat-delta ${delta > 0 ? 'over' : delta < 0 ? 'under' : 'exact'}`}
                >
                  ({delta > 0 ? '+' : ''}
                  {delta}분)
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Plan Blocks */}
        <div className="detail-section">
          <div className="detail-section-title">📋 수업 계획</div>
          {r.planBlocks.map((block) => (
            <div key={block.id} className="detail-block-card">
              <div className="detail-block-header">
                <div className="detail-block-title-row">
                  <span className="detail-block-title">
                    {block.title || '(제목 없음)'}
                  </span>
                  {block.subtitle && (
                    <span className="detail-block-subtitle">
                      {block.subtitle}
                    </span>
                  )}
                </div>
                <div className="detail-block-badges">
                  <span className="detail-block-minutes">
                    {block.minutes}분
                  </span>
                  <span
                    className="detail-cognitive-badge"
                    style={{
                      backgroundColor: `${COGNITIVE_COLORS[block.cognitiveLevel]}18`,
                      color: COGNITIVE_COLORS[block.cognitiveLevel],
                    }}
                  >
                    {COGNITIVE_LABELS[block.cognitiveLevel]}
                  </span>
                </div>
              </div>

              {/* Default Evals */}
              {Object.entries(block.defaultEvals).some(
                ([, ev]) => ev.rating > 0
              ) && (
                <div className="detail-evals">
                  {(
                    Object.entries(block.defaultEvals) as [
                      keyof DefaultEvals,
                      { rating: number; comment: string },
                    ][]
                  )
                    .filter(([, ev]) => ev.rating > 0)
                    .map(([key, ev]) => (
                      <div key={key} className="detail-eval-item">
                        <span className="detail-eval-label">
                          {EVAL_LABELS[key]}
                        </span>
                        {renderStars(ev.rating)}
                        {ev.comment && (
                          <p className="detail-eval-comment">{ev.comment}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Custom Evals */}
              {block.customEvals.filter((ce) => ce.rating > 0).length > 0 && (
                <div className="detail-evals">
                  {block.customEvals
                    .filter((ce) => ce.rating > 0)
                    .map((ce) => (
                      <div key={ce.id} className="detail-eval-item">
                        <span className="detail-eval-label">{ce.name}</span>
                        {renderStars(ce.rating)}
                        {ce.comment && (
                          <p className="detail-eval-comment">{ce.comment}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Memo */}
              {block.memo && (
                <div className="detail-memo">
                  <span className="detail-memo-label">메모</span>
                  <p className="detail-memo-text">{block.memo}</p>
                </div>
              )}

              {/* Expected Difficulty */}
              {block.expectedDifficulty && (
                <div className="detail-memo">
                  <span className="detail-memo-label">예상 난이도</span>
                  <p className="detail-memo-text">
                    {block.expectedDifficulty}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actual Blocks */}
        {r.actualBlocks.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🎯 실제 수업 회고</div>
            {r.actualBlocks.map((block) => {
              const blockDelta = block.actualMinutes - block.plannedMinutes;
              return (
                <div key={block.id} className="detail-block-card">
                  <div className="detail-block-header">
                    <div className="detail-block-title-row">
                      <span className="detail-block-title">
                        {block.title || '(제목 없음)'}
                      </span>
                      {block.subtitle && (
                        <span className="detail-block-subtitle">
                          {block.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="detail-block-badges">
                      <span className="detail-block-minutes">
                        {block.plannedMinutes}분 → {block.actualMinutes}분
                        <span
                          className={`detail-block-delta ${blockDelta > 0 ? 'over' : blockDelta < 0 ? 'under' : 'exact'}`}
                        >
                          {' '}
                          ({blockDelta > 0 ? '+' : ''}
                          {blockDelta}분)
                        </span>
                      </span>
                      <span
                        className="detail-cognitive-badge"
                        style={{
                          backgroundColor: `${COGNITIVE_COLORS[block.cognitiveLevel]}18`,
                          color: COGNITIVE_COLORS[block.cognitiveLevel],
                        }}
                      >
                        {COGNITIVE_LABELS[block.cognitiveLevel]}
                      </span>
                    </div>
                  </div>

                  {/* Default Evals */}
                  {Object.entries(block.defaultEvals).some(
                    ([, ev]) => ev.rating > 0
                  ) && (
                    <div className="detail-evals">
                      {(
                        Object.entries(block.defaultEvals) as [
                          keyof DefaultEvals,
                          { rating: number; comment: string },
                        ][]
                      )
                        .filter(([, ev]) => ev.rating > 0)
                        .map(([key, ev]) => (
                          <div key={key} className="detail-eval-item">
                            <span className="detail-eval-label">
                              {EVAL_LABELS[key]}
                            </span>
                            {renderStars(ev.rating)}
                            {ev.comment && (
                              <p className="detail-eval-comment">
                                {ev.comment}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Custom Evals */}
                  {block.customEvals.filter((ce) => ce.rating > 0).length >
                    0 && (
                    <div className="detail-evals">
                      {block.customEvals
                        .filter((ce) => ce.rating > 0)
                        .map((ce) => (
                          <div key={ce.id} className="detail-eval-item">
                            <span className="detail-eval-label">
                              {ce.name}
                            </span>
                            {renderStars(ce.rating)}
                            {ce.comment && (
                              <p className="detail-eval-comment">
                                {ce.comment}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Memo */}
                  {block.memo && (
                    <div className="detail-memo">
                      <span className="detail-memo-label">메모</span>
                      <p className="detail-memo-text">{block.memo}</p>
                    </div>
                  )}

                  {/* Improvements */}
                  {block.improvements && (
                    <div className="detail-memo">
                      <span className="detail-memo-label detail-memo-label-important">
                        개선사항
                      </span>
                      <p className="detail-memo-text">{block.improvements}</p>
                    </div>
                  )}

                  {/* Actual Difficulty */}
                  {block.actualDifficulty && (
                    <div className="detail-memo">
                      <span className="detail-memo-label">실제 난이도</span>
                      <p className="detail-memo-text">
                        {block.actualDifficulty}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Button */}
        <div className="detail-delete-section">
          <button
            className="detail-delete-btn"
            onClick={() => {
              if (window.confirm('이 회고를 삭제하시겠습니까?')) {
                onDelete(r.id);
                setSelectedReflection(null);
              }
            }}
          >
            이 회고 삭제
          </button>
        </div>
      </div>
    );
  }

  // List View
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
          <div
            key={reflection.id}
            className="reflection-card"
            onClick={() => setSelectedReflection(reflection)}
          >
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
