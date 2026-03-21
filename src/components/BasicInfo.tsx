'use client';

interface BasicInfoProps {
  classDate: string;
  classTimeStart: string;
  classTimeEnd: string;
  courseTitle: string;
  sessionNumber: string;
  onClassDateChange: (value: string) => void;
  onClassTimeStartChange: (value: string) => void;
  onClassTimeEndChange: (value: string) => void;
  onCourseTitleChange: (value: string) => void;
  onSessionNumberChange: (value: string) => void;
}

const QUICK_PRESETS = [
  { label: '오후반', start: '13:30', end: '17:00' },
  { label: '저녁반', start: '18:30', end: '22:00' },
];

export default function BasicInfo({
  classDate,
  classTimeStart,
  classTimeEnd,
  courseTitle,
  sessionNumber,
  onClassDateChange,
  onClassTimeStartChange,
  onClassTimeEndChange,
  onCourseTitleChange,
  onSessionNumberChange,
}: BasicInfoProps) {
  return (
    <div className="basic-info">
      <div className="basic-info-grid">
        <div className="form-group">
          <label>강좌명</label>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => onCourseTitleChange(e.target.value)}
            placeholder=""
          />
        </div>
        <div className="form-group">
          <label>차시</label>
          <input
            type="text"
            value={sessionNumber}
            onChange={(e) => onSessionNumberChange(e.target.value)}
            placeholder=""
          />
        </div>
        <div className="form-group">
          <label>수업 날짜</label>
          <input
            type="date"
            value={classDate}
            onChange={(e) => onClassDateChange(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>시작 시간</label>
          <input
            type="time"
            value={classTimeStart}
            onChange={(e) => onClassTimeStartChange(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>종료 시간</label>
          <input
            type="time"
            value={classTimeEnd}
            onChange={(e) => onClassTimeEndChange(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>빠른 설정</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="btn-add-block"
                style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
                onClick={() => {
                  onClassTimeStartChange(preset.start);
                  onClassTimeEndChange(preset.end);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
