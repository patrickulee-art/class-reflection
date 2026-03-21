'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlanBlock,
  Reflection,
  createPlanBlock,
  createStoryBlock,
  createBreakBlock,
  createProblemBlock,
} from '@/lib/types';
import { useReflections } from '@/hooks/useReflections';
import { useToast } from '@/hooks/useToast';
import BasicInfo from './BasicInfo';
import TimeSettings from './TimeSettings';
import CognitiveScorePreview from './CognitiveScorePreview';
import PlanBlockAccordion from './PlanBlockAccordion';

import ReflectionList from './ReflectionList';
import TensionWarmup from './TensionWarmup';
import Toast from './Toast';

const DRAFT_KEY = 'reflection_draft_v1';

function getDefaultBlocks(): { blocks: PlanBlock[]; nextId: number } {
  const blocks: PlanBlock[] = [];
  let id = 1;
  blocks.push(createPlanBlock(id++));
  return { blocks, nextId: id };
}

export default function ReflectionApp() {
  const { reflections, addReflection, deleteReflection, syncWithSupabase, isSyncing, isOnline } = useReflections();
  const { toast, showToast } = useToast();

  const [activeView, setActiveView] = useState<'new' | 'list'>('new');

  // Form fields
  const [classDate, setClassDate] = useState('');
  const [classTimeStart, setClassTimeStart] = useState('13:30');
  const [classTimeEnd, setClassTimeEnd] = useState('17:00');
  const [courseTitle, setCourseTitle] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');
  const [totalTimeLimit, setTotalTimeLimit] = useState(210);

  // Block state
  const [planBlocks, setPlanBlocks] = useState<PlanBlock[]>([]);
  const [blockIdCounter, setBlockIdCounter] = useState(1);
  const [editingReflectionId, setEditingReflectionId] = useState<number | null>(null);

  // Undo history
  const [undoHistory, setUndoHistory] = useState<PlanBlock[][]>([]);
  const pushUndo = useCallback(() => {
    setUndoHistory((prev) => [...prev.slice(-19), JSON.parse(JSON.stringify(planBlocks))]);
  }, [planBlocks]);

  // Hovered block index (for keyboard shortcuts)
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);

  // Initialize default blocks (only if no draft exists)
  useEffect(() => {
    const hasDraft = localStorage.getItem(DRAFT_KEY);
    if (hasDraft) return;

    const { blocks, nextId } = getDefaultBlocks();
    setPlanBlocks(blocks);
    setBlockIdCounter(nextId);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setClassDate(`${yyyy}-${mm}-${dd}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Plan block operations ---

  const addBlock = useCallback((factory: (id: number) => PlanBlock) => {
    setPlanBlocks((prev) => [...prev, factory(blockIdCounter)]);
    setBlockIdCounter((prev) => prev + 1);
  }, [blockIdCounter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeView !== 'new') return;

      // Don't trigger shortcuts when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Cmd+Z = undo (always works)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        setUndoHistory((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          setPlanBlocks(last);
          return prev.slice(0, -1);
        });
        return;
      }

      if (isTyping) return;

      // Ctrl+Enter = add block
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addBlock(createPlanBlock);
        return;
      }

      // 1/2/3 = set cognitive level on hovered block
      if (hoveredBlockIndex !== null && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const level = e.key === '1' ? 'low' : e.key === '2' ? 'medium' : 'high';
        pushUndo();
        setPlanBlocks((prev) => {
          const next = [...prev];
          const block = next[hoveredBlockIndex];
          if (block && !block.isStory && !block.isBreak) {
            next[hoveredBlockIndex] = { ...block, cognitiveLevel: level as PlanBlock['cognitiveLevel'] };
          }
          return next;
        });
        return;
      }

      // Shift+Delete or Shift+Backspace = delete hovered block
      if (hoveredBlockIndex !== null && e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        pushUndo();
        setPlanBlocks((prev) => prev.filter((_, i) => i !== hoveredBlockIndex));
        setHoveredBlockIndex(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, blockIdCounter, hoveredBlockIndex, pushUndo, addBlock]);

  const updatePlanBlock = useCallback((index: number, updated: PlanBlock) => {
    pushUndo();
    setPlanBlocks((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, [pushUndo]);

  const deletePlanBlock = useCallback((index: number) => {
    pushUndo();
    setPlanBlocks((prev) => prev.filter((_, i) => i !== index));
  }, [pushUndo]);

  // --- Drag and drop ---

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'top' : 'bottom';
      setDragOverIndex(index);
      setDragOverPosition(position);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
  }, []);

  const handleDrop = useCallback(
    (_e: React.DragEvent, dropIndex: number) => {
      if (dragIndex === null || dragIndex === dropIndex) {
        handleDragEnd();
        return;
      }

      setPlanBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        let insertAt = dropIndex;
        if (dragOverPosition === 'bottom') {
          insertAt = dragIndex < dropIndex ? dropIndex : dropIndex + 1;
        } else {
          insertAt = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
        }
        insertAt = Math.max(0, Math.min(insertAt, next.length));
        next.splice(insertAt, 0, moved);
        return next;
      });

      handleDragEnd();
    },
    [dragIndex, dragOverPosition, handleDragEnd]
  );

  // --- Save ---

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(() => {
    if (isSaving) return;
    if (planBlocks.length === 0) {
      showToast('error', '계획 구간이 없습니다.');
      return;
    }
    setIsSaving(true);

    const totalPlannedMinutes = planBlocks.reduce(
      (sum, b) => sum + b.minutes,
      0
    );

    const reflection: Reflection = {
      id: Date.now(),
      date: classDate,
      timeStart: classTimeStart,
      timeEnd: classTimeEnd,
      courseTitle,
      sessionNumber,
      lessonGoal: '',
      motivatingSpeech: '',
      totalTimeLimit,
      totalPlannedMinutes,
      totalActualMinutes: 0,
      planBlocks: JSON.parse(JSON.stringify(planBlocks)),
      actualBlocks: [],
      createdAt: new Date().toISOString(),
    };

    addReflection(reflection);
    showToast('success', '회고가 저장되었습니다!');

    // Reset form for new reflection
    const { blocks: newBlocks, nextId } = getDefaultBlocks();
    setPlanBlocks(newBlocks);
    setBlockIdCounter(nextId);
    setEditingReflectionId(null);
    setCourseTitle('');
    setSessionNumber('');
    setUndoHistory([]);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setClassDate(`${yyyy}-${mm}-${dd}`);
    localStorage.removeItem(DRAFT_KEY);

    setIsSaving(false);
  }, [
    isSaving,
    planBlocks,
    classDate,
    classTimeStart,
    classTimeEnd,
    courseTitle,
    sessionNumber,
    totalTimeLimit,
    addReflection,
    showToast,
  ]);

  // --- Load reflection into form ---

  const loadReflection = useCallback((reflection: Reflection) => {
    setClassDate(reflection.date || '');
    setClassTimeStart(reflection.timeStart || '13:30');
    setClassTimeEnd(reflection.timeEnd || '17:00');
    setCourseTitle(reflection.courseTitle || '');
    setSessionNumber(reflection.sessionNumber || '');
    setTotalTimeLimit(reflection.totalTimeLimit || 210);
    // Migrate old data: ensure kicks, isProblem exist on each block
    const blocks = (reflection.planBlocks || []).map((b) => ({
      ...b,
      kicks: b.kicks || [''],
      isProblem: b.isProblem || false,
    }));
    setPlanBlocks(JSON.parse(JSON.stringify(blocks)));
    const maxId = blocks.reduce((max, b) => Math.max(max, b.id), 0);
    setBlockIdCounter(maxId + 1);
    setEditingReflectionId(reflection.id);
    setActiveView('new');
  }, []);

  // --- Auto-draft (자동 임시저장) ---

  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.planBlocks && draft.planBlocks.length > 0) {
          setClassDate(draft.classDate || '');
          setClassTimeStart(draft.classTimeStart || '13:30');
          setClassTimeEnd(draft.classTimeEnd || '17:00');
          setCourseTitle(draft.courseTitle || '');
          setSessionNumber(draft.sessionNumber || '');
          setTotalTimeLimit(draft.totalTimeLimit || 210);
          setPlanBlocks(draft.planBlocks);
          setBlockIdCounter(draft.blockIdCounter || 1);
          setEditingReflectionId(draft.editingReflectionId || null);
        }
      } catch {
        // ignore invalid draft
      }
    }
    setDraftLoaded(true);
  }, []);

  // Auto-save draft whenever form state changes
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = setTimeout(() => {
      const draft = {
        classDate,
        classTimeStart,
        classTimeEnd,
        courseTitle,
        sessionNumber,
        totalTimeLimit,
        planBlocks,
        blockIdCounter,
        editingReflectionId,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [draftLoaded, classDate, classTimeStart, classTimeEnd, courseTitle, sessionNumber, totalTimeLimit, planBlocks, blockIdCounter, editingReflectionId]);

  // --- Cumulative minutes calculation ---

  const planCumulativeMinutes: number[] = [];
  let runningSum = 0;
  for (const b of planBlocks) {
    planCumulativeMinutes.push(runningSum);
    runningSum += b.minutes;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Teaching Design / Reflection System</h1>
        <p>수업 설계와 회고를 체계적으로 관리하세요 v13.0</p>
      </div>

      <div className="tabs" style={{ position: 'relative' }}>
        <button
          className={`tab ${activeView === 'new' ? 'active' : ''}`}
          onClick={() => setActiveView('new')}
        >
          새 회고 작성
        </button>
        <button
          className={`tab ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          회고 목록 ({reflections.length})
        </button>
        <div
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#9CA3AF',
            cursor: 'pointer',
          }}
          onClick={() => { if (!isSyncing) syncWithSupabase(); }}
          title={isSyncing ? '동기화 중...' : isOnline ? '온라인 (클릭하여 동기화)' : '오프라인'}
        >
          {isSyncing ? (
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#FBBF24',
                animation: 'syncPulse 1s ease-in-out infinite',
              }}
            />
          ) : (
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#22C55E' : '#9CA3AF',
              }}
            />
          )}
          {isSyncing && (
            <span style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 500 }}>
              동기화 중...
            </span>
          )}
        </div>
      </div>

      <div className="content">
        {/* New Reflection View */}
        {activeView === 'new' && (
          <div>
            <TensionWarmup />

            <BasicInfo
              classDate={classDate}
              classTimeStart={classTimeStart}
              classTimeEnd={classTimeEnd}
              courseTitle={courseTitle}
              sessionNumber={sessionNumber}
              onClassDateChange={setClassDate}
              onClassTimeStartChange={setClassTimeStart}
              onClassTimeEndChange={setClassTimeEnd}
              onCourseTitleChange={setCourseTitle}
              onSessionNumberChange={setSessionNumber}
            />

            <TimeSettings
              totalTimeLimit={totalTimeLimit}
              planBlocks={planBlocks}
              onTotalTimeLimitChange={setTotalTimeLimit}
            />

            <CognitiveScorePreview
              planBlocks={planBlocks}
              totalTimeLimit={totalTimeLimit}
            />

            {/* Plan Blocks Section */}
            <div className="section-divider">
              <span>📋 수업 계획 구간</span>
            </div>

            {planBlocks.map((block, index) => (
              <PlanBlockAccordion
                key={block.id}
                block={block}
                index={index}
                cumulativeMinutes={planCumulativeMinutes[index]}
                classTimeStart={classTimeStart}
                onChange={(updated) => updatePlanBlock(index, updated)}
                onDelete={() => deletePlanBlock(index)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                dragOverIndex={dragOverIndex}
                dragOverPosition={dragOverPosition}
                isDragging={dragIndex !== null}
                dragIndex={dragIndex}
                onMouseEnter={() => setHoveredBlockIndex(index)}
                onMouseLeave={() => setHoveredBlockIndex(null)}
              />
            ))}

            {/* Add block buttons */}
            <div className="buttons-row">
              <button className="btn-add-block" onClick={() => addBlock(createPlanBlock)}>
                수업 구간 추가
              </button>
              <button className="btn-add-block" onClick={() => addBlock(createProblemBlock)} style={{ background: '#9CA3AF', color: 'white' }}>
                ✏️ 문제 풀이 구간 추가
              </button>
              <button className="btn-add-story" onClick={() => addBlock(createStoryBlock)}>
                💬 썰 구간 추가
              </button>
              <button className="btn-add-break" onClick={() => addBlock(createBreakBlock)}>
                ⏰ 쉬는시간 추가
              </button>
            </div>

            {/* Save button */}
            <div style={{ marginTop: '20px' }}>
              <button className="btn-save" style={{ width: '100%' }} onClick={handleSave}>
                💾 저장하기
              </button>
            </div>
          </div>
        )}

        {/* Reflection List View */}
        {activeView === 'list' && (
          <ReflectionList
            reflections={reflections}
            onDelete={deleteReflection}
            onLoad={loadReflection}
          />
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
