'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
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
import { getSupabaseClient } from '@/lib/supabase';
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
const SUPABASE_DRAFT_ID = -1;

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
  const lastSupabaseSaveRef = useRef<string>('');

  // Helper to apply draft data to form state
  const applyDraft = useCallback((draft: Record<string, unknown>) => {
    setClassDate((draft.classDate as string) || '');
    setClassTimeStart((draft.classTimeStart as string) || '13:30');
    setClassTimeEnd((draft.classTimeEnd as string) || '17:00');
    setCourseTitle((draft.courseTitle as string) || '');
    setSessionNumber((draft.sessionNumber as string) || '');
    setLessonGoal((draft.lessonGoal as string) || '');
    setMotivatingSpeech((draft.motivatingSpeech as string) || '');
    setPrepTools(draft.prepTools && (draft.prepTools as string[]).length > 0 ? draft.prepTools as string[] : ['']);
    setTotalTimeLimit((draft.totalTimeLimit as number) || 210);
    setPlanBlocks(draft.planBlocks as PlanBlock[]);
    setBlockIdCounter((draft.blockIdCounter as number) || 1);
    setEditingReflectionId((draft.editingReflectionId as number | null) || null);
  }, []);

  // Initialize: check for edit mode (depends on reflections being loaded)
  useEffect(() => {
    if (draftLoaded) return; // Already initialized

    // New mode: skip draft and edit restoration, start fresh
    if (isNewMode) {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(EDIT_REFLECTION_KEY);
      // Also clear Supabase draft
      const client = getSupabaseClient();
      if (client) client.from('reflections').delete().eq('id', SUPABASE_DRAFT_ID).then(() => {});
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

    // Check for draft: compare local and remote, use the newer one
    const loadDraft = async () => {
      const localSaved = localStorage.getItem(DRAFT_KEY);
      let localDraft: Record<string, unknown> | null = null;
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (parsed.planBlocks && parsed.planBlocks.length > 0) {
            localDraft = parsed;
          }
        } catch { /* ignore */ }
      }

      // Try loading remote draft from Supabase
      let remoteDraft: Record<string, unknown> | null = null;
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data } = await client
            .from('reflections')
            .select('data')
            .eq('id', SUPABASE_DRAFT_ID)
            .single();
          if (data?.data && (data.data as Record<string, unknown>).planBlocks) {
            remoteDraft = data.data as Record<string, unknown>;
          }
        } catch { /* ignore */ }
      }

      // Pick the newer draft (compare savedAt timestamp)
      const localTime = localDraft?.savedAt ? new Date(localDraft.savedAt as string).getTime() : 0;
      const remoteTime = remoteDraft?.savedAt ? new Date(remoteDraft.savedAt as string).getTime() : 0;

      const bestDraft = remoteTime > localTime ? remoteDraft : localDraft;

      if (bestDraft && (bestDraft.planBlocks as PlanBlock[])?.length > 0) {
        applyDraft(bestDraft);
        setDraftLoaded(true);
        return;
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
    };

    loadDraft();
  }, [reflections, draftLoaded, editAttempted, isNewMode, applyDraft]);

  // Warn before browser close/refresh if there's unsaved content
  useEffect(() => {
    if (!draftLoaded) return;
    const hasContent = courseTitle || lessonGoal || motivatingSpeech || planBlocks.length > 1;
    if (!hasContent) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [draftLoaded, courseTitle, lessonGoal, motivatingSpeech, planBlocks.length]);

  // Auto-save draft to localStorage (500ms debounce)
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
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [draftLoaded, classDate, classTimeStart, classTimeEnd, courseTitle, sessionNumber, lessonGoal, motivatingSpeech, prepTools, totalTimeLimit, planBlocks, blockIdCounter, editingReflectionId]);

  // Auto-save draft to Supabase (10s interval)
  useEffect(() => {
    if (!draftLoaded) return;
    const hasContent = courseTitle || lessonGoal || motivatingSpeech || planBlocks.length > 1;
    if (!hasContent) return;

    const timer = setInterval(() => {
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
        savedAt: new Date().toISOString(),
      };
      const json = JSON.stringify(draft);
      // Skip if nothing changed since last Supabase save
      if (json === lastSupabaseSaveRef.current) return;

      const client = getSupabaseClient();
      if (!client) return;
      client.from('reflections').upsert({ id: SUPABASE_DRAFT_ID, data: draft }).then(({ error }) => {
        if (!error) {
          lastSupabaseSaveRef.current = json;
        }
      });
    }, 10000);

    return () => clearInterval(timer);
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
    // Clear Supabase draft
    const client = getSupabaseClient();
    if (client) client.from('reflections').delete().eq('id', SUPABASE_DRAFT_ID).then(() => {});
    lastSupabaseSaveRef.current = '';
    showToast('success', '설계가 저장되었습니다!');

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
        <h2>{editingReflectionId ? '설계 편집' : '새 설계 작성'}</h2>
      </div>

      <div className="content">
        <LessonGoalSection
          lessonGoal={lessonGoal}
          motivatingSpeech={motivatingSpeech}
          onLessonGoalChange={setLessonGoal}
          onMotivatingSpeechChange={setMotivatingSpeech}
        />

        <ClassPrepTools
          items={prepTools}
          onChange={setPrepTools}
        />

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
