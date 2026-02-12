'use client';

import { useState, useEffect, useCallback } from 'react';
import SliderGroup from './SliderGroup';
import { Reflection, Scores } from '@/lib/types';

interface WriteTabProps {
  onSubmit: (reflection: Reflection) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

function getLocalDatetimeString(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function WriteTab({ onSubmit, showToast }: WriteTabProps) {
  const [datetime, setDatetime] = useState('');
  const [className, setClassName] = useState('');
  const [topic, setTopic] = useState('');
  const [scores, setScores] = useState<Scores>({
    preparation: 3,
    engagement: 3,
    timeManagement: 3,
    satisfaction: 3,
    energy: 3,
  });
  const [preparationProcess, setPreparationProcess] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [actionItems, setActionItems] = useState('');

  useEffect(() => {
    setDatetime(getLocalDatetimeString());
  }, []);

  const updateScore = useCallback((key: keyof Scores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setDatetime(getLocalDatetimeString());
    setClassName('');
    setTopic('');
    setScores({
      preparation: 3,
      engagement: 3,
      timeManagement: 3,
      satisfaction: 3,
      energy: 3,
    });
    setPreparationProcess('');
    setStrengths('');
    setImprovements('');
    setActionItems('');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const reflection: Reflection = {
        id: Date.now(),
        datetime,
        className,
        topic,
        scores,
        preparationProcess,
        strengths,
        improvements,
        actionItems,
        createdAt: new Date().toISOString(),
      };

      onSubmit(reflection);
      showToast('success', '성찰 기록이 저장되었습니다!');
      resetForm();
    },
    [datetime, className, topic, scores, preparationProcess, strengths, improvements, actionItems, onSubmit, showToast, resetForm]
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Info */}
      <div className="card">
        <div className="card-header">
          <span className="icon">&#128197;</span>
          <h2>기본 정보</h2>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>날짜 및 시간</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>학급/반</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="예: 3학년 2반"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>수업 주제</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 빈칸 추론 유형 전략"
            required
          />
        </div>
      </div>

      {/* Quantitative Evaluation */}
      <div className="card">
        <div className="card-header">
          <span className="icon">&#128200;</span>
          <h2>정량 평가</h2>
        </div>
        <SliderGroup
          label="수업 준비 충실도"
          value={scores.preparation}
          onChange={(v) => updateScore('preparation', v)}
        />
        <SliderGroup
          label="학생 집중도/참여도"
          value={scores.engagement}
          onChange={(v) => updateScore('engagement', v)}
        />
        <SliderGroup
          label="시간 관리"
          value={scores.timeManagement}
          onChange={(v) => updateScore('timeManagement', v)}
        />
        <SliderGroup
          label="자기 만족도"
          value={scores.satisfaction}
          onChange={(v) => updateScore('satisfaction', v)}
        />
        <SliderGroup
          label="에너지 레벨"
          value={scores.energy}
          onChange={(v) => updateScore('energy', v)}
        />
      </div>

      {/* Qualitative Evaluation */}
      <div className="card">
        <div className="card-header">
          <span className="icon">&#128221;</span>
          <h2>정성 평가</h2>
        </div>
        <div className="form-group">
          <label>&#128218; 수업 준비 과정</label>
          <textarea
            value={preparationProcess}
            onChange={(e) => setPreparationProcess(e.target.value)}
            placeholder="준비하면서 느낀 점, 겪었던 문제점 등을 기록하세요"
          />
        </div>
        <div className="form-group">
          <label>&#128077; 잘한 점</label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="오늘 수업에서 잘된 부분을 적어주세요..."
          />
        </div>
        <div className="form-group">
          <label>&#128736; 개선할 점</label>
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="다음에 개선하면 좋을 부분을 적어주세요..."
          />
        </div>
        <div className="form-group">
          <label>&#127919; 다음 수업 적용 사항</label>
          <textarea
            value={actionItems}
            onChange={(e) => setActionItems(e.target.value)}
            placeholder="다음 수업에 적용할 구체적인 사항을 적어주세요..."
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-full">
          <span>&#128190;</span>
          저장하기
        </button>
        <button type="button" className="btn btn-secondary" onClick={resetForm}>
          <span>&#128260;</span>
          초기화
        </button>
      </div>
    </form>
  );
}
