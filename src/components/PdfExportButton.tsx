'use client';

import { useRef, useState } from 'react';
import { Reflection, PlanBlock, CognitiveLevel, DefaultEvals, CustomEval } from '@/lib/types';

const COGNITIVE_COLORS: Record<CognitiveLevel, string> = {
  none: '#E2E8F0',
  low: '#DBEAFE',
  medium: '#FEF3C7',
  high: '#FEE2E2',
  story: '#E0E7FF',
  break: '#D1FAE5',
  problem: '#FCE7F3',
};

const COGNITIVE_LABELS: Record<CognitiveLevel, string> = {
  none: '미설정',
  low: '낮음',
  medium: '보통',
  high: '높음',
  story: '썰',
  break: '휴식',
  problem: '문제풀이',
};

const EVAL_LABELS: Record<string, string> = {
  flow: '설명 흐름',
  kick: '도입 킥',
  humor: '유머/재미',
  nonverbal: '비언어적 표현',
  board: '판서',
};

function stars(rating: number): string {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
}

interface PdfExportButtonProps {
  reflection: Reflection;
}

export default function PdfExportButton({ reflection }: PdfExportButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      // Dynamic import for client-side only library
      const html2pdf = (await import('html2pdf.js')).default;

      const element = containerRef.current;
      if (!element) return;

      // Temporarily make the hidden div visible for rendering
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.display = 'block';

      const safeTitle = reflection.courseTitle.replace(/\s/g, '');
      const filename = `${reflection.date}_${safeTitle}_${reflection.sessionNumber}.pdf`;

      const opt = {
        margin: 15,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await html2pdf().set(opt as any).from(element).save();

      // Hide it again
      element.style.display = 'none';
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const hasLessonGoal = reflection.lessonGoal?.trim();
  const hasMotivating = reflection.motivatingSpeech?.trim();
  const defaultKeys = ['flow', 'kick', 'humor', 'nonverbal', 'board'] as const;

  return (
    <>
      <button
        className="detail-edit-btn"
        onClick={handleExport}
        disabled={exporting}
        style={{ opacity: exporting ? 0.6 : 1 }}
      >
        {exporting ? '내보내는 중...' : 'PDF 내보내기'}
      </button>

      {/* Hidden PDF content */}
      <div
        ref={containerRef}
        style={{ display: 'none' }}
      >
        <div style={{
          fontFamily: '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
          color: '#1A1A1A',
          width: '180mm',
          padding: '0',
          fontSize: '11px',
          lineHeight: '1.6',
        }}>
          {/* Header section */}
          <div style={{
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #1A1A1A',
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '6px',
            }}>
              {reflection.courseTitle || '(제목 없음)'}
              {reflection.sessionNumber ? ` - ${reflection.sessionNumber}` : ''}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#555',
              display: 'flex',
              gap: '16px',
            }}>
              <span>{reflection.date}</span>
              {reflection.timeStart && reflection.timeEnd && (
                <span>{reflection.timeStart} ~ {reflection.timeEnd}</span>
              )}
              <span>{reflection.totalTimeLimit}분</span>
            </div>
          </div>

          {/* Lesson Goal section */}
          {(hasLessonGoal || hasMotivating) && (
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '16px',
            }}>
              {hasLessonGoal && (
                <div style={{ marginBottom: hasMotivating ? '8px' : '0' }}>
                  <span style={{ fontWeight: '600', fontSize: '12px', color: '#475569' }}>
                    수업 목표:
                  </span>{' '}
                  <span style={{ fontSize: '12px' }}>{reflection.lessonGoal}</span>
                </div>
              )}
              {hasMotivating && (
                <div>
                  <span style={{ fontWeight: '600', fontSize: '12px', color: '#475569' }}>
                    Motivating Speech:
                  </span>{' '}
                  <span style={{ fontSize: '12px' }}>{reflection.motivatingSpeech}</span>
                </div>
              )}
            </div>
          )}

          {/* Cognitive Load Summary Bar */}
          {reflection.planBlocks && reflection.planBlocks.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '6px',
                color: '#475569',
              }}>
                인지부하 흐름
              </div>
              <div style={{
                display: 'flex',
                width: '100%',
                height: '24px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
              }}>
                {reflection.planBlocks.map((block, idx) => {
                  const totalMins = reflection.planBlocks.reduce((s, b) => s + b.minutes, 0);
                  const widthPercent = totalMins > 0 ? (block.minutes / totalMins) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: COGNITIVE_COLORS[block.cognitiveLevel],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: '500',
                        color: '#374151',
                        borderRight: idx < reflection.planBlocks.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {widthPercent > 8 ? `${block.minutes}분` : ''}
                    </div>
                  );
                })}
              </div>
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '4px',
                flexWrap: 'wrap',
              }}>
                {(['none', 'low', 'medium', 'high', 'story', 'break', 'problem'] as CognitiveLevel[]).map((level) => {
                  const hasLevel = reflection.planBlocks.some((b) => b.cognitiveLevel === level);
                  if (!hasLevel) return null;
                  return (
                    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: '#6B7280' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: COGNITIVE_COLORS[level],
                        border: '1px solid rgba(0,0,0,0.1)',
                      }} />
                      {COGNITIVE_LABELS[level]}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan Blocks */}
          {reflection.planBlocks && reflection.planBlocks.length > 0 && (
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '10px',
                color: '#1A1A1A',
              }}>
                수업 구간 ({reflection.planBlocks.length}개)
              </div>

              {reflection.planBlocks.map((block, idx) => (
                <PdfBlock
                  key={block.id}
                  block={block}
                  index={idx}
                  defaultKeys={defaultKeys}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PdfBlock({
  block,
  index,
  defaultKeys,
}: {
  block: PlanBlock;
  index: number;
  defaultKeys: readonly ('flow' | 'kick' | 'humor' | 'nonverbal' | 'board')[];
}) {
  const hasDefaultEvals = defaultKeys.some(
    (key) => block.defaultEvals[key]?.rating > 0 || block.defaultEvals[key]?.comment
  );
  const hasCustomEvals = (block.customEvals || []).some((e) => e.rating > 0 || e.comment);
  const filteredKicks = (block.kicks || []).filter((k) => k.trim() !== '');

  return (
    <div style={{
      breakInside: 'avoid',
      pageBreakInside: 'avoid',
      pageBreakBefore: 'auto',
      border: '1px solid #E2E8F0',
      borderRadius: '6px',
      padding: '12px 14px',
      marginBottom: '10px',
      backgroundColor: '#FFFFFF',
    }}>
      {/* Block header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
      }}>
        <div>
          <div style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#1A1A1A',
          }}>
            {index + 1}. {block.title || '(제목 없음)'}
          </div>
          {block.subtitle && (
            <div style={{
              fontSize: '11px',
              color: '#6B7280',
              marginTop: '2px',
            }}>
              {block.subtitle}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            fontSize: '10px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '10px',
            backgroundColor: '#F1F5F9',
            color: '#475569',
          }}>
            {block.minutes}분
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '10px',
            backgroundColor: COGNITIVE_COLORS[block.cognitiveLevel],
            color: '#1A1A1A',
          }}>
            {COGNITIVE_LABELS[block.cognitiveLevel]}
          </span>
        </div>
      </div>

      {/* Evaluations */}
      {(hasDefaultEvals || hasCustomEvals) && (
        <div style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: '6px',
          marginBottom: '6px',
        }}>
          {defaultKeys.map((key) => {
            const evalData = block.defaultEvals[key];
            if (!evalData || (evalData.rating === 0 && !evalData.comment)) return null;
            return (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                marginBottom: '3px',
              }}>
                <span style={{ fontWeight: '600', color: '#475569', minWidth: '80px' }}>
                  {EVAL_LABELS[key]}
                </span>
                <span style={{ color: '#F59E0B', letterSpacing: '1px' }}>
                  {stars(evalData.rating)}
                </span>
                {evalData.comment && (
                  <span style={{ color: '#6B7280', fontSize: '10px' }}>
                    - {evalData.comment}
                  </span>
                )}
              </div>
            );
          })}
          {(block.customEvals || []).map((evalItem) => {
            if (evalItem.rating === 0 && !evalItem.comment) return null;
            return (
              <div key={evalItem.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                marginBottom: '3px',
              }}>
                <span style={{ fontWeight: '600', color: '#475569', minWidth: '80px' }}>
                  {evalItem.name}
                </span>
                <span style={{ color: '#F59E0B', letterSpacing: '1px' }}>
                  {stars(evalItem.rating)}
                </span>
                {evalItem.comment && (
                  <span style={{ color: '#6B7280', fontSize: '10px' }}>
                    - {evalItem.comment}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Kicks */}
      {filteredKicks.length > 0 && (
        <div style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: '6px',
          marginBottom: '6px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '3px' }}>
            Kicks
          </div>
          <ul style={{
            margin: '0',
            paddingLeft: '16px',
            fontSize: '11px',
            color: '#374151',
          }}>
            {filteredKicks.map((kick, i) => (
              <li key={i} style={{ marginBottom: '1px' }}>{kick}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Memo */}
      {block.memo && (
        <div style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: '6px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>
            메모
          </div>
          <div style={{
            fontSize: '11px',
            color: '#374151',
            whiteSpace: 'pre-wrap',
          }}>
            {block.memo}
          </div>
        </div>
      )}
    </div>
  );
}
