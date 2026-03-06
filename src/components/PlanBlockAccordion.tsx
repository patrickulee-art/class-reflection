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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
  onMouseEnter,
  onMouseLeave,
}: PlanBlockAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [evalDropdownOpen, setEvalDropdownOpen] = useState(false);
  const [customEvalInput, setCustomEvalInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cognitiveClass = `cognitive-${block.cognitiveLevel}`;
  const blockIcon = block.isBreak ? '⏰' : block.isStory ? '💬' : block.isProblem ? '✏️' : '📚';

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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
          {/* Cognitive level buttons or spacer for alignment */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0, marginRight: '10px', width: '34px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!block.isStory && !block.isBreak && !block.isProblem ? (
              [
                { level: 'low' as CognitiveLevel, emoji: '🟢', title: '인지 부하: 낮음' },
                { level: 'medium' as CognitiveLevel, emoji: '🟡', title: '인지 부하: 보통' },
                { level: 'high' as CognitiveLevel, emoji: '🔴', title: '인지 부하: 높음' },
              ].map(({ level, emoji, title }) => (
                <button
                  key={level}
                  type="button"
                  style={{
                    border: 'none',
                    background: block.cognitiveLevel === level ? 'rgba(255,255,255,0.85)' : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => handleCognitiveChange(level)}
                  title={title}
                >
                  {emoji}
                </button>
              ))
            ) : (
              <span style={{ fontSize: '20px', textAlign: 'center', paddingTop: '4px' }}>{blockIcon}</span>
            )}
          </div>

          {/* Text inputs - vertical layout */}
          <div
            style={{ display: 'flex', flex: 1, minWidth: 0, maxWidth: '720px' }}
          >
            {/* Input column - all inputs same width */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}
            >
              <input
                type="text"
                className="accordion-title-input"
                value={block.title}
                onChange={(e) => onChange({ ...block, title: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="제목"
              />
              {/* Subtitle - hidden for problem blocks */}
              {!block.isProblem && (
                <input
                  type="text"
                  className="accordion-subtitle-input"
                  value={block.subtitle}
                  onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="소재"
                />
              )}
              {/* Problem number inputs - horizontal layout */}
              {block.isProblem && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {block.kicks.map((num, ki) => (
                    <div key={ki} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <input
                        type="text"
                        value={num}
                        onChange={(e) => {
                          const newKicks = [...block.kicks];
                          newKicks[ki] = e.target.value;
                          onChange({ ...block, kicks: newKicks });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={`${ki + 1}`}
                        style={{
                          width: '45px',
                          textAlign: 'center',
                          padding: '6px 4px',
                          border: '1.5px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: 'rgba(255,255,255,0.7)',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>번</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: '14px',
                        color: '#9CA3AF',
                        visibility: block.kicks.length > 1 ? 'visible' : 'hidden',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newKicks = block.kicks.slice(0, -1);
                        onChange({ ...block, kicks: newKicks });
                      }}
                      title="문제 삭제"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '0 4px',
                        fontSize: '14px',
                        color: '#9CA3AF',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({ ...block, kicks: [...block.kicks, ''] });
                      }}
                      title="문제 추가"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              {/* Dynamic kick inputs - hidden for break and problem blocks */}
              {!block.isBreak && !block.isProblem && block.kicks.map((kick, ki) => (
                <input
                  key={ki}
                  type="text"
                  className="accordion-subtitle-input"
                  value={kick}
                  onChange={(e) => {
                    const newKicks = [...block.kicks];
                    newKicks[ki] = e.target.value;
                    onChange({ ...block, kicks: newKicks });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`킥 ${ki + 1}`}
                />
              ))}
            </div>
            {/* Kick +/- buttons outside input column - hidden for break and problem blocks */}
            {!block.isBreak && !block.isProblem && (
              <div
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flexShrink: 0, width: '36px', marginLeft: '2px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px' }}>
                  <button
                    type="button"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '0 4px',
                      fontSize: '14px',
                      color: '#9CA3AF',
                      visibility: block.kicks.length > 1 ? 'visible' : 'hidden',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newKicks = block.kicks.slice(0, -1);
                      onChange({ ...block, kicks: newKicks });
                    }}
                    title="킥 삭제"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '0 4px',
                      fontSize: '14px',
                      color: '#9CA3AF',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ ...block, kicks: [...block.kicks, ''] });
                    }}
                    title="킥 추가"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}
        >
          {/* Minutes input */}
          <input
            type="number"
            className="time-input"
            value={block.minutes}
            onChange={(e) =>
              onChange({ ...block, minutes: Math.max(1, Number(e.target.value) || 1) })
            }
            onClick={(e) => e.stopPropagation()}
            min={1}
            style={{ width: '60px' }}
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>분</span>
          {timeRange && (
            <span className="time-range-display">{timeRange}</span>
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
                    placeholder=""
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
                    placeholder=""
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
                    placeholder=""
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
              placeholder=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}
