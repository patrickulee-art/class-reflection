'use client';

import { useState } from 'react';
import { ActualBlock, CustomEval } from '@/lib/types';
import StarRating from './StarRating';

interface ActualBlockAccordionProps {
  block: ActualBlock;
  index: number;
  cumulativeActualMinutes: number;
  classTimeStart: string;
  totalTimeLimit: number;
  onChange: (updated: ActualBlock) => void;
}

const EVAL_TOOLTIPS: Record<string, string> = {
  flow: '설명의 논리적 흐름과 순서가 적절했는지',
  kick: '수업 도입부에서 학생들의 주의를 끌었는지',
  humor: '적절한 재미 요소로 집중도를 유지했는지',
  nonverbal: '제스처, 표정, 목소리 톤이 효과적이었는지',
  board: '판서가 깔끔하고 이해하기 쉬웠는지',
};

const EVAL_LABELS: Record<string, string> = {
  flow: '설명 흐름',
  kick: '도입 킥',
  humor: '유머/재미',
  nonverbal: '비언어적 표현',
  board: '판서',
};

const PREDEFINED_EVALS = ['학생 참여도', '속도 적절성', '판서', '예문 적절성'];

function formatTimeRange(
  classTimeStart: string,
  cumulativeMinutes: number,
  blockMinutes: number
): string {
  if (!classTimeStart) return '';
  const [h, m] = classTimeStart.split(':').map(Number);
  const startTotal = h * 60 + m + cumulativeMinutes;
  const endTotal = startTotal + blockMinutes;
  const fmt = (total: number) => {
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  return `${fmt(startTotal)}-${fmt(endTotal)}`;
}

export default function ActualBlockAccordion({
  block,
  index,
  cumulativeActualMinutes,
  classTimeStart,
  totalTimeLimit,
  onChange,
}: ActualBlockAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [evalDropdownOpen, setEvalDropdownOpen] = useState(false);
  const [customEvalInput, setCustomEvalInput] = useState('');

  const cognitiveClass = `cognitive-${block.cognitiveLevel}`;
  const blockIcon = block.isBreak ? '⏰' : block.isStory ? '💬' : '📚';

  const timeDiff = block.actualMinutes - block.plannedMinutes;
  const timeDiffClass =
    timeDiff > 0 ? 'over' : timeDiff < 0 ? 'under' : 'exact';
  const timeDiffText =
    timeDiff > 0
      ? `+${timeDiff}분`
      : timeDiff < 0
        ? `${timeDiff}분`
        : '정시';

  const progressPercent = totalTimeLimit > 0
    ? Math.round((block.actualMinutes / totalTimeLimit) * 100)
    : 0;
  const isOverLimit = block.actualMinutes > block.plannedMinutes;

  const timeRange = formatTimeRange(
    classTimeStart,
    cumulativeActualMinutes,
    block.actualMinutes
  );

  const handleDefaultEvalRatingChange = (
    key: keyof typeof block.defaultEvals,
    rating: number
  ) => {
    onChange({
      ...block,
      defaultEvals: {
        ...block.defaultEvals,
        [key]: { ...block.defaultEvals[key], rating },
      },
    });
  };

  const handleDefaultEvalCommentChange = (
    key: keyof typeof block.defaultEvals,
    comment: string
  ) => {
    onChange({
      ...block,
      defaultEvals: {
        ...block.defaultEvals,
        [key]: { ...block.defaultEvals[key], comment },
      },
    });
  };

  const addCustomEval = (name: string) => {
    if (!name.trim()) return;
    const newEval: CustomEval = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      rating: 0,
      comment: '',
    };
    onChange({ ...block, customEvals: [...block.customEvals, newEval] });
    setEvalDropdownOpen(false);
    setCustomEvalInput('');
  };

  const removeCustomEval = (id: string) => {
    onChange({
      ...block,
      customEvals: block.customEvals.filter((e) => e.id !== id),
    });
  };

  const updateCustomEvalRating = (id: string, rating: number) => {
    onChange({
      ...block,
      customEvals: block.customEvals.map((e) =>
        e.id === id ? { ...e, rating } : e
      ),
    });
  };

  const updateCustomEvalComment = (id: string, comment: string) => {
    onChange({
      ...block,
      customEvals: block.customEvals.map((e) =>
        e.id === id ? { ...e, comment } : e
      ),
    });
  };

  return (
    <div className={`accordion-block ${isOpen ? 'open' : ''}`}>
      <div
        className={`accordion-header actual ${cognitiveClass}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="accordion-title-section">
          <span className="accordion-icon">&#9654;</span>
          <span className="block-type-badge">{blockIcon}</span>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>
            {block.title || `구간 ${index + 1}`}
          </span>
          {block.subtitle && (
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              {block.subtitle}
            </span>
          )}
          {timeRange && (
            <span className="time-range-display">{timeRange}</span>
          )}
          <span className={`time-diff-badge ${timeDiffClass}`}>
            {timeDiffText}
          </span>

          {/* Progress bar */}
          <div className="progress-bar-container" title={`${progressPercent}%`}>
            <div
              className={`progress-bar-fill ${isOverLimit ? 'over-limit' : ''}`}
              style={{
                width: `${Math.min(
                  (block.actualMinutes / block.plannedMinutes) * 100,
                  150
                )}%`,
              }}
            />
          </div>
          <span
            className={`progress-percentage ${isOverLimit ? 'over-limit' : ''}`}
          >
            {block.plannedMinutes > 0
              ? Math.round((block.actualMinutes / block.plannedMinutes) * 100)
              : 0}
            %
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            계획 {block.plannedMinutes}분
          </span>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>→</span>
          <input
            type="number"
            className="time-input"
            value={block.actualMinutes}
            onChange={(e) =>
              onChange({
                ...block,
                actualMinutes: Math.max(0, Number(e.target.value) || 0),
              })
            }
            min={0}
            style={{ width: '60px' }}
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>분</span>
        </div>
      </div>

      <div className="accordion-content">
        <div className="accordion-inner">
          {/* Default evaluations */}
          <div className="default-evals">
            {(
              Object.keys(block.defaultEvals) as Array<
                keyof typeof block.defaultEvals
              >
            ).map((key) => (
              <div key={key} className="default-eval-item">
                <div className="eval-label-group">
                  <span className="eval-label">{EVAL_LABELS[key]}</span>
                  <span className="tooltip-icon">
                    &#9432;
                    <span className="tooltip-text">{EVAL_TOOLTIPS[key]}</span>
                  </span>
                </div>
                <StarRating
                  rating={block.defaultEvals[key].rating}
                  onChange={(r) => handleDefaultEvalRatingChange(key, r)}
                />
                <textarea
                  className="comment-input"
                  value={block.defaultEvals[key].comment}
                  onChange={(e) =>
                    handleDefaultEvalCommentChange(key, e.target.value)
                  }
                  placeholder="코멘트 입력..."
                />
              </div>
            ))}
          </div>

          {/* Custom evaluations */}
          {block.customEvals.length > 0 && (
            <div className="custom-evals">
              {block.customEvals.map((evalItem) => (
                <div key={evalItem.id} className="custom-eval-item">
                  <button
                    className="btn-remove-eval"
                    onClick={() => removeCustomEval(evalItem.id)}
                  >
                    삭제
                  </button>
                  <div className="eval-label-group">
                    <span className="eval-label">{evalItem.name}</span>
                  </div>
                  <StarRating
                    rating={evalItem.rating}
                    onChange={(r) => updateCustomEvalRating(evalItem.id, r)}
                  />
                  <textarea
                    className="comment-input"
                    value={evalItem.comment}
                    onChange={(e) =>
                      updateCustomEvalComment(evalItem.id, e.target.value)
                    }
                    placeholder="코멘트 입력..."
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add eval dropdown */}
          <div className="add-eval-section">
            <div className="eval-dropdown">
              <button
                className="btn-add-eval"
                onClick={() => setEvalDropdownOpen(!evalDropdownOpen)}
              >
                + 평가 항목 추가
              </button>
              <div
                className={`eval-dropdown-menu ${evalDropdownOpen ? 'show' : ''}`}
              >
                {PREDEFINED_EVALS.map((name) => (
                  <div
                    key={name}
                    className="eval-option"
                    onClick={() => addCustomEval(name)}
                  >
                    {name}
                  </div>
                ))}
                <div className="eval-option custom-input">
                  <input
                    type="text"
                    className="custom-eval-input"
                    value={customEvalInput}
                    onChange={(e) => setCustomEvalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomEval(customEvalInput);
                      }
                    }}
                    placeholder="직접 입력 후 Enter"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actual difficulty memo */}
          <div className="memo-section">
            <div className="memo-title-group">
              <span className="memo-title important">실제 어려웠던 점</span>
            </div>
            <textarea
              className="memo-textarea"
              value={block.actualDifficulty}
              onChange={(e) =>
                onChange({ ...block, actualDifficulty: e.target.value })
              }
              placeholder="이 구간에서 실제로 어려웠던 점..."
            />
          </div>

          {/* Memo */}
          <div className="memo-section">
            <div className="memo-title-group">
              <span className="memo-title">메모</span>
            </div>
            <textarea
              className="memo-textarea"
              value={block.memo}
              onChange={(e) => onChange({ ...block, memo: e.target.value })}
              placeholder="이 구간에 대한 메모..."
            />
          </div>

          {/* Improvements */}
          <div className="memo-section">
            <div className="memo-title-group">
              <span className="memo-title important">개선 사항</span>
            </div>
            <textarea
              className="memo-textarea"
              value={block.improvements}
              onChange={(e) =>
                onChange({ ...block, improvements: e.target.value })
              }
              placeholder="다음에 이 구간을 어떻게 개선할지..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
