'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReflectionsContext } from '@/contexts/ReflectionsContext';
import { loadReflections } from '@/lib/storage';

const SETTINGS_KEY = 'app_settings_v1';

interface AppSettings {
  defaultTimeStart: string;
  defaultTimeEnd: string;
  defaultTimeLimit: number;
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return { defaultTimeStart: '13:30', defaultTimeEnd: '17:00', defaultTimeLimit: 210 };
  }
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return { defaultTimeStart: '13:30', defaultTimeEnd: '17:00', defaultTimeLimit: 210 };
}

function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function SettingsPage() {
  const { reflections, isSyncing, isOnline, syncWithSupabase } = useReflectionsContext();

  const [settings, setSettings] = useState<AppSettings>({
    defaultTimeStart: '13:30',
    defaultTimeEnd: '17:00',
    defaultTimeLimit: 210,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleChange = useCallback((key: keyof AppSettings, value: string | number) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleExport = useCallback(() => {
    const data = loadReflections();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflections_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>설정</h2>
      </div>

      <div className="content">
        <div className="settings-section">
          <h3 className="settings-section-title">기본 수업 시간 설정</h3>
          <div className="settings-row">
            <label className="settings-label">시작 시간</label>
            <input
              type="time"
              className="settings-input"
              value={settings.defaultTimeStart}
              onChange={(e) => handleChange('defaultTimeStart', e.target.value)}
            />
          </div>
          <div className="settings-row">
            <label className="settings-label">종료 시간</label>
            <input
              type="time"
              className="settings-input"
              value={settings.defaultTimeEnd}
              onChange={(e) => handleChange('defaultTimeEnd', e.target.value)}
            />
          </div>
          <div className="settings-row">
            <label className="settings-label">기본 수업 시간 (분)</label>
            <input
              type="number"
              className="settings-input"
              value={settings.defaultTimeLimit}
              onChange={(e) => handleChange('defaultTimeLimit', Number(e.target.value))}
              min={1}
            />
          </div>
          {saved && (
            <p className="settings-saved">설정이 저장되었습니다.</p>
          )}
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">데이터 내보내기</h3>
          <p className="settings-description">
            모든 회고 데이터를 JSON 파일로 내보냅니다. (현재 {reflections.length}개)
          </p>
          <button className="settings-btn" onClick={handleExport}>
            JSON 내보내기
          </button>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Supabase 동기화</h3>
          <div className="settings-sync-status">
            <span
              className="sync-dot"
              style={{
                backgroundColor: isSyncing ? '#FBBF24' : isOnline ? '#22C55E' : '#9CA3AF',
                animation: isSyncing ? 'syncPulse 1s ease-in-out infinite' : 'none',
              }}
            />
            <span>
              {isSyncing
                ? '동기화 중...'
                : isOnline
                  ? '온라인 (연결됨)'
                  : '오프라인 (연결 안 됨)'}
            </span>
          </div>
          <button
            className="settings-btn"
            onClick={() => { if (!isSyncing) syncWithSupabase(); }}
            disabled={isSyncing}
          >
            {isSyncing ? '동기화 중...' : '수동 동기화'}
          </button>
        </div>
      </div>
    </div>
  );
}
