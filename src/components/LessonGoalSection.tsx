'use client';

interface LessonGoalSectionProps {
  lessonGoal: string;
  motivatingSpeech: string;
  onLessonGoalChange: (value: string) => void;
  onMotivatingSpeechChange: (value: string) => void;
}

export default function LessonGoalSection({
  lessonGoal,
  motivatingSpeech,
  onLessonGoalChange,
  onMotivatingSpeechChange,
}: LessonGoalSectionProps) {
  return (
    <div className="lesson-goal-section">
      <div className="lesson-goal-header">
        <span className="lesson-goal-icon">🎯</span>
        <span className="lesson-goal-title">수업 방향</span>
      </div>
      <div className="lesson-goal-fields">
        <div className="form-group">
          <label>수업 목표</label>
          <input
            type="text"
            value={lessonGoal}
            onChange={(e) => onLessonGoalChange(e.target.value)}
            placeholder="이번 수업에서 달성하고 싶은 목표"
          />
        </div>
        <div className="form-group">
          <label>Motivating Speech</label>
          <textarea
            className="lesson-goal-textarea"
            value={motivatingSpeech}
            onChange={(e) => onMotivatingSpeechChange(e.target.value)}
            placeholder="수업 시작 전 나에게 하는 한마디"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
