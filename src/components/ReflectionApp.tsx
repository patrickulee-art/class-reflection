'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlanBlock,
  ActualBlock,
  Reflection,
  createPlanBlock,
  createStoryBlock,
  createBreakBlock,
} from '@/lib/types';
import { useReflections } from '@/hooks/useReflections';
import { useToast } from '@/hooks/useToast';
import BasicInfo from './BasicInfo';
import TimeSettings from './TimeSettings';
import CognitiveScorePreview from './CognitiveScorePreview';
import PlanBlockAccordion from './PlanBlockAccordion';
import ActualBlockAccordion from './ActualBlockAccordion';
import ReflectionList from './ReflectionList';
import Toast from './Toast';

function getDefaultBlocks(): { blocks: PlanBlock[]; nextId: number } {
  const blocks: PlanBlock[] = [];
  let id = 1;
  blocks.push({ ...createPlanBlock(id++), title: '도입/복습', minutes: 10, cognitiveLevel: 'low' });
  blocks.push({ ...createPlanBlock(id++), title: '핵심 개념 설명', minutes: 30, cognitiveLevel: 'medium' });
  blocks.push({ ...createPlanBlock(id++), title: '활동/연습', minutes: 25, cognitiveLevel: 'high' });
  blocks.push({ ...createStoryBlock(id++), minutes: 5 });
  blocks.push({ ...createPlanBlock(id++), title: '정리/마무리', minutes: 10, cognitiveLevel: 'low' });
  return { blocks, nextId: id };
}

export default function ReflectionApp() {
  const { reflections, addReflection, deleteReflection } = useReflections();
  const { toast, showToast } = useToast();

  const [activeView, setActiveView] = useState<'new' | 'list'>('new');

  // Form fields
  const [classDate, setClassDate] = useState('');
  const [classTimeStart, setClassTimeStart] = useState('');
  const [classTimeEnd, setClassTimeEnd] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');
  const [totalTimeLimit, setTotalTimeLimit] = useState(210);

  // Block state
  const [planBlocks, setPlanBlocks] = useState<PlanBlock[]>([]);
  const [actualBlocks, setActualBlocks] = useState<ActualBlock[]>([]);
  const [blockIdCounter, setBlockIdCounter] = useState(1);
  const [actualGenerated, setActualGenerated] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);

  // Initialize default blocks
  useEffect(() => {
    const { blocks, nextId } = getDefaultBlocks();
    setPlanBlocks(blocks);
    setBlockIdCounter(nextId);

    // Set today's date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setClassDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeView !== 'new') return;

      // Ctrl+Enter = add block
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addNormalBlock();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, blockIdCounter]);

  // --- Plan block operations ---

  const addNormalBlock = useCallback(() => {
    setPlanBlocks((prev) => [...prev, createPlanBlock(blockIdCounter)]);
    setBlockIdCounter((prev) => prev + 1);
  }, [blockIdCounter]);

  const addStoryBlock = useCallback(() => {
    setPlanBlocks((prev) => [...prev, createStoryBlock(blockIdCounter)]);
    setBlockIdCounter((prev) => prev + 1);
  }, [blockIdCounter]);

  const addBreakBlock = useCallback(() => {
    setPlanBlocks((prev) => [...prev, createBreakBlock(blockIdCounter)]);
    setBlockIdCounter((prev) => prev + 1);
  }, [blockIdCounter]);

  const updatePlanBlock = useCallback((index: number, updated: PlanBlock) => {
    setPlanBlocks((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []);

  const deletePlanBlock = useCallback((index: number) => {
    setPlanBlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

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

  // --- Generate actual blocks ---

  const generateActualBlocks = useCallback(() => {
    if (planBlocks.length === 0) {
      showToast('error', '계획 구간이 없습니다. 구간을 먼저 추가해주세요.');
      return;
    }

    const generated: ActualBlock[] = planBlocks.map((pb) => ({
      id: pb.id,
      title: pb.title,
      subtitle: pb.subtitle,
      plannedMinutes: pb.minutes,
      actualMinutes: pb.minutes,
      cognitiveLevel: pb.cognitiveLevel,
      isStory: pb.isStory,
      isBreak: pb.isBreak,
      defaultEvals: JSON.parse(JSON.stringify(pb.defaultEvals)),
      customEvals: JSON.parse(JSON.stringify(pb.customEvals)),
      actualDifficulty: '',
      memo: pb.memo,
      improvements: '',
    }));

    setActualBlocks(generated);
    setActualGenerated(true);
    showToast('success', `${generated.length}개 실제 수업 구간이 생성되었습니다.`);
  }, [planBlocks, showToast]);

  const updateActualBlock = useCallback((index: number, updated: ActualBlock) => {
    setActualBlocks((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []);

  // --- Save ---

  const handleSave = useCallback(() => {
    if (planBlocks.length === 0) {
      showToast('error', '계획 구간이 없습니다.');
      return;
    }

    const totalPlannedMinutes = planBlocks.reduce(
      (sum, b) => sum + b.minutes,
      0
    );
    const totalActualMinutes = actualBlocks.reduce(
      (sum, b) => sum + b.actualMinutes,
      0
    );

    const reflection: Reflection = {
      id: Date.now(),
      date: classDate,
      timeStart: classTimeStart,
      timeEnd: classTimeEnd,
      courseTitle,
      sessionNumber,
      totalTimeLimit,
      totalPlannedMinutes,
      totalActualMinutes,
      planBlocks: JSON.parse(JSON.stringify(planBlocks)),
      actualBlocks: JSON.parse(JSON.stringify(actualBlocks)),
      createdAt: new Date().toISOString(),
    };

    addReflection(reflection);
    showToast('success', '회고가 저장되었습니다!');

    // Reset form
    const { blocks, nextId } = getDefaultBlocks();
    setPlanBlocks(blocks);
    setBlockIdCounter(nextId);
    setActualBlocks([]);
    setActualGenerated(false);
    setCourseTitle('');
    setSessionNumber('');
  }, [
    planBlocks,
    actualBlocks,
    classDate,
    classTimeStart,
    classTimeEnd,
    courseTitle,
    sessionNumber,
    totalTimeLimit,
    addReflection,
    showToast,
  ]);

  // --- Cumulative minutes calculation ---

  const planCumulativeMinutes: number[] = [];
  let runningSum = 0;
  for (const b of planBlocks) {
    planCumulativeMinutes.push(runningSum);
    runningSum += b.minutes;
  }

  const actualCumulativeMinutes: number[] = [];
  let actualRunningSum = 0;
  for (const b of actualBlocks) {
    actualCumulativeMinutes.push(actualRunningSum);
    actualRunningSum += b.actualMinutes;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Teaching Design / Reflection System</h1>
        <p>수업 설계와 회고를 체계적으로 관리하세요 v13.0</p>
      </div>

      <div className="tabs">
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
      </div>

      <div className="content">
        {/* New Reflection View */}
        {activeView === 'new' && (
          <div>
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
                totalBlocks={planBlocks.length}
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
              />
            ))}

            {/* Add block buttons */}
            <div className="buttons-row">
              <button className="btn-add-block" onClick={addNormalBlock}>
                + 구간 추가
              </button>
              <button className="btn-add-story" onClick={addStoryBlock}>
                💬 썰 구간 추가
              </button>
              <button className="btn-add-break" onClick={addBreakBlock}>
                ⏰ 쉬는시간 추가
              </button>
            </div>

            {/* Generate actual blocks */}
            <div className="generate-section">
              <button className="btn-generate" onClick={generateActualBlocks}>
                🎯 실제 수업 구간 생성
              </button>
              <div className="generate-hint">
                계획 구간을 기반으로 실제 수업 기록용 구간이 생성됩니다
              </div>
            </div>

            {/* Actual Blocks Section */}
            {actualGenerated && actualBlocks.length > 0 && (
              <>
                <div className="section-divider">
                  <span>🎯 실제 수업 회고</span>
                </div>

                {actualBlocks.map((block, index) => (
                  <ActualBlockAccordion
                    key={block.id}
                    block={block}
                    index={index}
                    cumulativeActualMinutes={actualCumulativeMinutes[index]}
                    classTimeStart={classTimeStart}
                    totalTimeLimit={totalTimeLimit}
                    onChange={(updated) => updateActualBlock(index, updated)}
                  />
                ))}
              </>
            )}

            {/* Save button */}
            <button className="btn-save" onClick={handleSave}>
              💾 회고 저장하기
            </button>
          </div>
        )}

        {/* Reflection List View */}
        {activeView === 'list' && (
          <ReflectionList
            reflections={reflections}
            onDelete={deleteReflection}
          />
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
