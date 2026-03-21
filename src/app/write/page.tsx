'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlanBlock,
  Reflection,
  createPlanBlock,
  createStoryBlock,
  createBreakBlock,
  createProblemBlock,
} from '@/lib/types';
import { useReflectionsContext } from '@/contexts/ReflectionsContext';
import { useToast } from '@/hooks/useToast';
import BasicInfo from '@/components/BasicInfo';
import TimeSettings from '@/components/TimeSettings';
import CognitiveScorePreview from '@/components/CognitiveScorePreview';
import PlanBlockAccordion from '@/components/PlanBlockAccordion';
import LessonGoalSection from '@/components/LessonGoalSection';
import TensionWarmup from '@/components/TensionWarmup';
import ClassPrepTools from '@/components/ClassPrepTools';
import Toast from '@/components/Toast';

const DRAFT_KEY = 'reflection_draft_v1';
const EDIT_REFLECTION_KEY = 'edit_reflection_id';

function getDefaultBlocks(): { blocks: PlanBlock[]; nextId: number } {
  const blocks: PlanBlock[] = [];
  let id = 1;
  blocks.push(createPlanBlock(id++));
  return { blocks, nextId: id };
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="write-page"><div className="page-header"><h2>로딩 중...</h2></div></div>}>
      <WritePageContent />
    </Suspense>
  );
}

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewMode = searchParams.get('new') === 'true';
  const { reflections, addReflection } = useReflectionsContext();
  const { toast, showToast } = useToast();

  // Form fields
  const [classDate, setClassDate] = useState('');
  const [classTimeStart, setClassTimeStart] = useState('13:30');
  const [classTimeEnd, setClassTimeEnd] = useState('17:00');
  const [courseTitle, setCourseTitle] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');
  const [lessonGoal, setLessonGoal] = useState('');
  const [motivatingSpeech, setMotivatingSpeech] = useState('');
  const [prepTools, setPrepTools] = useState<string[]>(['']);
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

  // Hovered block index
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);

  // Draft loaded flag
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [editAttempted, setEditAttempted] = useState(false);

  // Initialize: check for edit mode (depends on reflections being loaded)
  useEffect(() => {
    if (draftLoaded) return; // Already initialized

    // New mode: skip draft and edit restoration, start fresh
    if (isNewMode) {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(EDIT_REFLECTION_KEY);
      const { blocks, nextId } = getDefaultBlocks();
      setPlanBlocks(blocks);
      setBlockIdCounter(nextId);
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setClassDate(`${yyyy}-${mm}-${dd}`);
      setDraftLoaded(true);
      return;
    }

    const editId = localStorage.getItem(EDIT_REFLECTION_KEY);

    // If there's an edit ID, wait for reflections to load before proceeding
    if (editId && reflections.length === 0 && !editAttempted) {
      return; // Wait for reflections to load
    }

    if (editId) {
      localStorage.removeItem(EDIT_REFLECTION_KEY);
      setEditAttempted(true);
      const id = Number(editId);
      const reflection = reflections.find((r) => r.id === id);
      if (reflection) {
        setClassDate(reflection.date || '');
        setClassTimeStart(reflection.timeStart || '13:30');
        setClassTimeEnd(reflection.timeEnd || '17:00');
        setCourseTitle(reflection.courseTitle || '');
        setSessionNumber(reflection.sessionNumber || '');
        setLessonGoal(reflection.lessonGoal || '');
        setMotivatingSpeech(reflection.motivatingSpeech || '');
        setPrepTools(reflection.prepTools && reflection.prepTools.length > 0 ? reflection.prepTools : ['']);
        setTotalTimeLimit(reflection.totalTimeLimit || 210);
        const blocks = (reflection.planBlocks || []).map((b) => ({
          ...b,
          kicks: b.kicks || [''],
          isProblem: b.isProblem || false,
        }));
        setPlanBlocks(JSON.parse(JSON.stringify(blocks)));
        const maxId = blocks.reduce((max, b) => Math.max(max, b.id), 0);
        setBlockIdCounter(maxId + 1);
        setEditingReflectionId(reflection.id);
        setDraftLoaded(true);
        return;
      }
    }

    // Check for draft
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
          setLessonGoal(draft.lessonGoal || '');
          setMotivatingSpeech(draft.motivatingSpeech || '');
          setPrepTools(draft.prepTools && draft.prepTools.length > 0 ? draft.prepTools : ['']);
          setTotalTimeLimit(draft.totalTimeLimit || 210);
          setPlanBlocks(draft.planBlocks);
          setBlockIdCounter(draft.blockIdCounter || 1);
          setEditingReflectionId(draft.editingReflectionId || null);
          setDraftLoaded(true);
          return;
        }
      } catch {
        // ignore invalid draft
      }
    }

    // Default: new reflection
    const { blocks, nextId } = getDefaultBlocks();
    setPlanBlocks(blocks);
    setBlockIdCounter(nextId);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setClassDate(`${yyyy}-${mm}-${dd}`);
    setDraftLoaded(true);
  }, [reflections, draftLoaded, editAttempted, isNewMode]);

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
        lessonGoal,
        motivatingSpeech,
        prepTools,
        totalTimeLimit,
        planBlocks,
        blockIdCounter,
        editingReflectionId,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [draftLoaded, classDate, classTimeStart, classTimeEnd, courseTitle, sessionNumber, lessonGoal, motivatingSpeech, prepTools, totalTimeLimit, planBlocks, blockIdCounter, editingReflectionId]);

  // Plan block operations
  const addBlock = useCallback((factory: (id: number) => PlanBlock) => {
    setPlanBlocks((prev) => [...prev, factory(blockIdCounter)]);
    setBlockIdCounter((prev) => prev + 1);
  }, [blockIdCounter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

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

      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addBlock(createPlanBlock);
        return;
      }

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
  }, [blockIdCounter, hoveredBlockIndex, pushUndo, addBlock]);

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

  // Drag and drop
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

  // Save
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
      id: editingReflectionId || Date.now(),
      date: classDate,
      timeStart: classTimeStart,
      timeEnd: classTimeEnd,
      courseTitle,
      sessionNumber,
      lessonGoal,
      motivatingSpeech,
      prepTools: prepTools.filter((t) => t.trim() !== ''),
      totalTimeLimit,
      totalPlannedMinutes,
      totalActualMinutes: 0,
      planBlocks: JSON.parse(JSON.stringify(planBlocks)),
      actualBlocks: [],
      createdAt: new Date().toISOString(),
    };

    addReflection(reflection);
    localStorage.removeItem(DRAFT_KEY);
    showToast('success', '회고가 저장되었습니다!');

    // Navigate to reflections list after short delay for toast visibility
    setTimeout(() => {
      router.push('/reflections');
    }, 600);

    setIsSaving(false);
  }, [
    isSaving,
    planBlocks,
    classDate,
    classTimeStart,
    classTimeEnd,
    courseTitle,
    sessionNumber,
    lessonGoal,
    motivatingSpeech,
    prepTools,
    totalTimeLimit,
    editingReflectionId,
    addReflection,
    showToast,
  ]);

  // Cumulative minutes
  const planCumulativeMinutes: number[] = [];
  let runningSum = 0;
  for (const b of planBlocks) {
    planCumulativeMinutes.push(runningSum);
    runningSum += b.minutes;
  }

  return (
    <div className="write-page">
      <div className="page-header">
        <h2>{editingReflectionId ? '회고 편집' : '새 회고 작성'}</h2>
      </div>

      <div className="content">
        <LessonGoalSection
          lessonGoal={lessonGoal}
          motivatingSpeech={motivatingSpeech}
          onLessonGoalChange={setLessonGoal}
          onMotivatingSpeechChange={setMotivatingSpeech}
        />

        <TensionWarmup />

        <ClassPrepTools
          items={prepTools}
          onChange={setPrepTools}
        />

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

        <div className="section-divider">
          <span>{'📋'} 수업 계획 구간</span>
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

        <div className="buttons-row">
          <button className="btn-add-block" onClick={() => addBlock(createPlanBlock)}>
            수업 구간 추가
          </button>
          <button className="btn-add-block" onClick={() => addBlock(createProblemBlock)} style={{ background: '#9CA3AF', color: 'white' }}>
            {'✏️'} 문제 풀이 구간 추가
          </button>
          <button className="btn-add-story" onClick={() => addBlock(createStoryBlock)}>
            {'💬'} 썰 구간 추가
          </button>
          <button className="btn-add-break" onClick={() => addBlock(createBreakBlock)}>
            {'⏰'} 쉬는시간 추가
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button className="btn-save" style={{ width: '100%' }} onClick={handleSave}>
            {'💾'} 저장하기
          </button>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
