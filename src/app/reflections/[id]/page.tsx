'use client';

import { useParams, useRouter } from 'next/navigation';
import { useReflectionsContext } from '@/contexts/ReflectionsContext';
import CognitiveScorePreview from '@/components/CognitiveScorePreview';
import { PlanBlock, CognitiveLevel, DefaultEvals, CustomEval } from '@/lib/types';
import PdfExportButton from '@/components/PdfExportButton';

const EDIT_REFLECTION_KEY = 'edit_reflection_id';

const COGNITIVE_COLORS: Record<CognitiveLevel, string> = {
  none: '#e0e7ff',
  low: '#d1fae5',
  medium: '#fef3c7',
  high: '#fee2e2',
  story: '#dbeafe',
  break: '#cbd5e1',
  problem: '#d1d5db',
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

// Render star rating as text characters
function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <span className="detail-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`detail-star ${star <= rating ? 'filled' : 'empty'}`}
        >
          {star <= rating ? '\u2605' : '\u2606'}
        </span>
      ))}
    </span>
  );
}

// Render a single eval item (label + stars + optional comment)
function EvalItem({ label, rating, comment }: { label: string; rating: number; comment?: string }) {
  if (rating === 0 && !comment) return null;
  return (
    <div className="detail-eval-item">
      <span className="detail-eval-label">{label}</span>
      <ReadOnlyStars rating={rating} />
      {comment && <div className="detail-eval-comment">{comment}</div>}
    </div>
  );
}

// Render all evaluations for a plan block
function BlockEvals({ defaultEvals, customEvals }: { defaultEvals: DefaultEvals; customEvals: CustomEval[] }) {
  const defaultKeys = ['flow', 'kick', 'humor', 'nonverbal', 'board'] as const;
  const hasDefaultEvals = defaultKeys.some(
    (key) => defaultEvals[key]?.rating > 0 || defaultEvals[key]?.comment
  );
  const hasCustomEvals = customEvals.some((e) => e.rating > 0 || e.comment);

  if (!hasDefaultEvals && !hasCustomEvals) return null;

  return (
    <div className="detail-evals">
      {defaultKeys.map((key) => (
        <EvalItem
          key={key}
          label={EVAL_LABELS[key]}
          rating={defaultEvals[key]?.rating || 0}
          comment={defaultEvals[key]?.comment}
        />
      ))}
      {customEvals.map((evalItem) => (
        <EvalItem
          key={evalItem.id}
          label={evalItem.name}
          rating={evalItem.rating}
          comment={evalItem.comment}
        />
      ))}
    </div>
  );
}

// Render kicks list
function KicksList({ kicks }: { kicks: string[] }) {
  const filteredKicks = kicks.filter((k) => k.trim() !== '');
  if (filteredKicks.length === 0) return null;

  return (
    <div className="detail-kicks">
      <span className="detail-memo-label">Kicks</span>
      <ul className="detail-kicks-list">
        {filteredKicks.map((kick, idx) => (
          <li key={idx}>{kick}</li>
        ))}
      </ul>
    </div>
  );
}

// Render a single plan block card
function DetailBlockCard({ block, index }: { block: PlanBlock; index: number }) {
  const cogColor = COGNITIVE_COLORS[block.cognitiveLevel];
  const cogLabel = COGNITIVE_LABELS[block.cognitiveLevel];

  return (
    <div className="detail-block-card">
      <div className="detail-block-header">
        <div className="detail-block-title-row">
          <div className="detail-block-title">
            {index + 1}. {block.title || '(제목 없음)'}
          </div>
          {block.subtitle && (
            <div className="detail-block-subtitle">{block.subtitle}</div>
          )}
        </div>
        <div className="detail-block-badges">
          <span className="detail-block-minutes">{block.minutes}분</span>
          <span
            className="detail-cognitive-badge"
            style={{
              backgroundColor: cogColor,
              color: '#1A1A1A',
            }}
          >
            {cogLabel}
          </span>
        </div>
      </div>

      <BlockEvals
        defaultEvals={block.defaultEvals}
        customEvals={block.customEvals || []}
      />

      <KicksList kicks={block.kicks || []} />

      {block.memo && (
        <div className="detail-memo">
          <span className="detail-memo-label">메모</span>
          <div className="detail-memo-text">{block.memo}</div>
        </div>
      )}
    </div>
  );
}

export default function ReflectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { reflections } = useReflectionsContext();

  const id = Number(params.id);
  const reflection = reflections.find((r) => r.id === id);

  if (!reflection) {
    return (
      <div className="detail-page">
        <div className="detail-not-found">
          <p className="detail-not-found-icon">{'?'}</p>
          <p className="detail-not-found-title">회고를 찾을 수 없습니다</p>
          <p className="detail-not-found-desc">
            존재하지 않거나 삭제된 회고입니다.
          </p>
          <button
            className="detail-back-btn"
            onClick={() => router.push('/reflections')}
          >
            {'<-'} 목록으로
          </button>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    localStorage.setItem(EDIT_REFLECTION_KEY, String(reflection.id));
    router.push('/write');
  };

  const hasLessonGoal = reflection.lessonGoal?.trim();
  const hasMotivating = reflection.motivatingSpeech?.trim();

  return (
    <div className="detail-page">
      {/* Header with navigation */}
      <div className="detail-page-nav">
        <button
          className="detail-back-btn"
          onClick={() => router.push('/reflections')}
        >
          {'<-'} 목록으로
        </button>
        <PdfExportButton reflection={reflection} />
        <button className="detail-edit-btn" onClick={handleEdit}>
          편집하기
        </button>
      </div>

      {/* Course title and meta */}
      <div className="detail-header-card">
        <div className="detail-course-title">
          {reflection.courseTitle || '(제목 없음)'}
          {reflection.sessionNumber
            ? ` - ${reflection.sessionNumber}`
            : ''}
        </div>
        <div className="detail-meta">
          <span>{reflection.date}</span>
          {reflection.timeStart && reflection.timeEnd && (
            <span>
              {reflection.timeStart} ~ {reflection.timeEnd}
            </span>
          )}
          <span>총 {reflection.totalTimeLimit}분</span>
        </div>
      </div>

      {/* Lesson Goal section */}
      {(hasLessonGoal || hasMotivating) && (
        <div className="detail-goal-card">
          {hasLessonGoal && (
            <div className="detail-goal-item">
              <span className="detail-goal-label">수업 목표</span>
              <div className="detail-goal-text">{reflection.lessonGoal}</div>
            </div>
          )}
          {hasMotivating && (
            <div className="detail-goal-item">
              <span className="detail-goal-label">Motivating Speech</span>
              <div className="detail-goal-text">
                {reflection.motivatingSpeech}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prep Tools */}
      {reflection.prepTools && reflection.prepTools.length > 0 && reflection.prepTools.some((t: string) => t.trim() !== '') && (
        <div className="detail-section">
          <h3 className="detail-section-title">수업 준비 도구</h3>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {reflection.prepTools.filter((t: string) => t.trim() !== '').map((tool: string, i: number) => (
              <li key={i} style={{ fontSize: '15px', color: '#374151' }}>{tool}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cognitive Load Visualization */}
      {reflection.planBlocks && reflection.planBlocks.length > 0 && (
        <div className="detail-section">
          <CognitiveScorePreview
            planBlocks={reflection.planBlocks}
            totalTimeLimit={reflection.totalTimeLimit}
          />
        </div>
      )}

      {/* Plan Blocks */}
      {reflection.planBlocks && reflection.planBlocks.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">
            수업 구간 ({reflection.planBlocks.length}개)
          </div>
          {reflection.planBlocks.map((block, idx) => (
            <DetailBlockCard key={block.id} block={block} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
