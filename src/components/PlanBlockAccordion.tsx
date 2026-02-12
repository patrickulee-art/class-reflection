'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { PlanBlock, CognitiveLevel, CustomEval } from '@/lib/types';
import StarRating from './StarRating';

interface PlanBlockAccordionProps {
  block: PlanBlock;
  index: number;
  totalBlocks: number;
  cumulativeMinutes: number;
  classTimeStart: string;
  onChange: (updated: PlanBlock) => void;
  onDelete: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  dragOverIndex: number | null;
  dragOverPosition: 'top' | 'bottom' | null;
  isDragging: boolean;
  dragIndex: number | null;
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

export default function PlanBlockAccordion({
  block,
  index,
  cumulativeMinutes,
  classTimeStart,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  dragOverIndex,
  dragOverPosition,
  isDragging,
  dragIndex,
}: PlanBlockAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [evalDropdownOpen, setEvalDropdownOpen] = useState(false);
  const [customEvalInput, setCustomEvalInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cognitiveClass = `cognitive-${block.cognitiveLevel}`;
  const blockIcon = block.isBreak ? '⏰' : block.isStory ? '💬' : '📚';

  const handleTypeChange = (type: 'normal' | 'story' | 'break') => {
    if (type === 'story') {
      onChange({
        ...block,
        isStory: true,
        isBreak: false,
        cognitiveLevel: 'story',
      });
    } else if (type === 'break') {
      onChange({
        ...block,
        isStory: false,
        isBreak: true,
        cognitiveLevel: 'break',
      });
    } else {
      onChange({
        ...block,
        isStory: false,
        isBreak: false,
        cognitiveLevel: 'medium',
      });
    }
  };

  const handleCognitiveChange = (level: CognitiveLevel) => {
    onChange({ ...block, cognitiveLevel: level });
  };

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

  const handleCustomEvalKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomEval(customEvalInput);
    }
  };

  const dragClasses = [
    isDragging && dragIndex === index ? 'dragging' : '',
    dragOverIndex === index && dragOverPosition === 'top'
      ? 'drag-over-top'
      : '',
    dragOverIndex === index && dragOverPosition === 'bottom'
      ? 'drag-over-bottom'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const timeRange = formatTimeRange(classTimeStart, cumulativeMinutes, block.minutes);

  return (
    <div
      className={`accordion-block ${isOpen ? 'open' : ''} ${dragClasses}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e, index);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
    >
      <div
        className={`accordion-header ${cognitiveClass}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="accordion-title-section">
          <span className="accordion-icon">&#9654;</span>
          <span className="block-type-badge">{blockIcon}</span>

          {/* Block type buttons */}
          <div
            style={{ display: 'flex', gap: '2px', flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                border: 'none',
                background: !block.isStory && !block.isBreak ? 'rgba(255,255,255,0.8)' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '16px',
              }}
              onClick={() => handleTypeChange('normal')}
              title="일반 구간"
            >
              📚
            </button>
            <button
              type="button"
              style={{
                border: 'none',
                background: block.isStory ? 'rgba(255,255,255,0.8)' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '16px',
              }}
              onClick={() => handleTypeChange('story')}
              title="썰 구간"
            >
              💬
            </button>
            <button
              type="button"
              style={{
                border: 'none',
                background: block.isBreak ? 'rgba(255,255,255,0.8)' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '16px',
              }}
              onClick={() => handleTypeChange('break')}
              title="쉬는 시간"
            >
              ⏰
            </button>
          </div>

          {/* Cognitive level buttons */}
          {!block.isStory && !block.isBreak && (
            <div
              style={{ display: 'flex', gap: '2px', flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                style={{
                  border: 'none',
                  background: block.cognitiveLevel === 'low' ? 'rgba(255,255,255,0.8)' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '14px',
                }}
                onClick={() => handleCognitiveChange('low')}
                title="인지 부하: 낮음"
              >
                🟢
              </button>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: block.cognitiveLevel === 'medium' ? 'rgba(255,255,255,0.8)' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '14px',
                }}
                onClick={() => handleCognitiveChange('medium')}
                title="인지 부하: 보통"
              >
                🟡
              </button>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: block.cognitiveLevel === 'high' ? 'rgba(255,255,255,0.8)' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '14px',
                }}
                onClick={() => handleCognitiveChange('high')}
                title="인지 부하: 높음"
              >
                🔴
              </button>
            </div>
          )}

          {/* Delete button */}
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '16px',
              flexShrink: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="구간 삭제"
          >
            🗑️
          </button>

          {/* Title input */}
          <input
            type="text"
            className="accordion-title-input"
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="구간 제목"
          />

          {/* Subtitle input */}
          <input
            type="text"
            className="accordion-subtitle-input"
            value={block.subtitle}
            onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="세부 내용"
          />

          {/* Kick input - third row concept, shown inline */}
          <input
            type="text"
            className="accordion-subtitle-input"
            value={block.expectedDifficulty}
            onChange={(e) =>
              onChange({ ...block, expectedDifficulty: e.target.value })
            }
            onClick={(e) => e.stopPropagation()}
            placeholder="킥/도입 포인트"
            style={{ maxWidth: '200px' }}
          />
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Minutes input */}
          <input
            type="number"
            className="time-input"
            value={block.minutes}
            onChange={(e) =>
              onChange({ ...block, minutes: Math.max(1, Number(e.target.value) || 1) })
            }
            min={1}
            style={{ width: '60px' }}
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>분</span>
          {timeRange && (
            <span className="time-range-display">{timeRange}</span>
          )}
        </div>
      </div>

      <div className="accordion-content">
        <div className="accordion-inner">
          {/* Default evaluations */}
          <div className="default-evals">
            {(Object.keys(block.defaultEvals) as Array<keyof typeof block.defaultEvals>).map(
              (key) => (
                <div key={key} className="default-eval-item">
                  <div className="eval-label-group">
                    <span className="eval-label">{EVAL_LABELS[key]}</span>
                    <span className="tooltip-icon">
                      &#9432;
                      <span className="tooltip-text">
                        {EVAL_TOOLTIPS[key]}
                      </span>
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
              )
            )}
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
            <div className="eval-dropdown" ref={dropdownRef}>
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
                    onKeyDown={handleCustomEvalKeyDown}
                    placeholder="직접 입력 후 Enter"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
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
        </div>
      </div>
    </div>
  );
}
