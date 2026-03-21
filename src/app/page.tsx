'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useReflectionsContext } from '@/contexts/ReflectionsContext';
import { Reflection } from '@/lib/types';

const DRAFT_KEY = 'reflection_draft_v1';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  return `${mm}월 ${dd}일 (${day})`;
}

export default function DashboardPage() {
  const { reflections, isSyncing, isOnline, syncWithSupabase } = useReflectionsContext();
  const [hasDraft, setHasDraft] = useState(false);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.planBlocks && parsed.planBlocks.length > 0) {
          setHasDraft(true);
        }
      } catch {
        // ignore
      }
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTodayStr(`${yyyy}-${mm}-${dd}`);
  }, []);

  const todayReflections = reflections.filter((r) => r.date === todayStr);

  const todayDisplay = todayStr ? formatDate(todayStr) : '';

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Teaching Design / Reflection</h1>
        <p>수업 설계와 회고를 체계적으로 관리하세요 v13.0</p>
        <div
          className="sync-indicator"
          onClick={() => { if (!isSyncing) syncWithSupabase(); }}
          title={isSyncing ? '동기화 중...' : isOnline ? '온라인 (클릭하여 동기화)' : '오프라인'}
        >
          <span
            className="sync-dot"
            style={{
              backgroundColor: isSyncing ? '#FBBF24' : isOnline ? '#22C55E' : '#9CA3AF',
              animation: isSyncing ? 'syncPulse 1s ease-in-out infinite' : 'none',
            }}
          />
          {isSyncing && <span className="sync-text">동기화 중...</span>}
        </div>
      </div>

      <Link href="/write?new=true" className="dashboard-cta">
        새 수업 회고 작성하기
      </Link>

      {hasDraft && (
        <Link href="/write" className="dashboard-draft-alert">
          <span className="draft-alert-icon">{'📝'}</span>
          <div className="draft-alert-text">
            <strong>작성 중인 회고가 있습니다</strong>
            <span>이어서 작성하려면 탭하세요</span>
          </div>
          <span className="draft-alert-arrow">{'→'}</span>
        </Link>
      )}

      <div className="dashboard-card">
        <div className="dashboard-card-title">오늘의 회고</div>
        <div className="dashboard-today-info">
          <span className="dashboard-today-date">{todayDisplay}</span>
          <span className="dashboard-today-count">
            {todayReflections.length}개의 회고
          </span>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-title">전체 통계</div>
        <div className="dashboard-today-info">
          <span className="dashboard-today-count">
            총 {reflections.length}개의 회고가 저장되어 있습니다
          </span>
        </div>
      </div>
    </div>
  );
}
