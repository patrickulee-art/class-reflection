'use client';

import { useMemo } from 'react';
import { Reflection } from '@/lib/types';

interface StatsTabProps {
  reflections: Reflection[];
}

function calculateStreak(reflections: Reflection[]): number {
  if (reflections.length === 0) return 0;

  const dates = [
    ...new Set(reflections.map((r) => new Date(r.datetime).toDateString())),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const prev = new Date(dates[i - 1]);
    const diffDays = Math.round(
      (prev.getTime() - current.getTime()) / 86400000
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default function StatsTab({ reflections }: StatsTabProps) {
  const stats = useMemo(() => {
    if (reflections.length === 0) {
      return {
        total: 0,
        overallAvg: '-',
        thisMonth: 0,
        streak: 0,
        avgs: {
          preparation: '-',
          engagement: '-',
          timeManagement: '-',
          satisfaction: '-',
          energy: '-',
        },
        trendData: [],
      };
    }

    const count = reflections.length;
    const totals = {
      preparation: 0,
      engagement: 0,
      timeManagement: 0,
      satisfaction: 0,
      energy: 0,
    };

    reflections.forEach((r) => {
      totals.preparation += r.scores.preparation;
      totals.engagement += r.scores.engagement;
      totals.timeManagement += r.scores.timeManagement;
      totals.satisfaction += r.scores.satisfaction;
      totals.energy += r.scores.energy;
    });

    const avgs = {
      preparation: (totals.preparation / count).toFixed(1),
      engagement: (totals.engagement / count).toFixed(1),
      timeManagement: (totals.timeManagement / count).toFixed(1),
      satisfaction: (totals.satisfaction / count).toFixed(1),
      energy: (totals.energy / count).toFixed(1),
    };

    const overallAvg = (
      (parseFloat(avgs.preparation) +
        parseFloat(avgs.engagement) +
        parseFloat(avgs.timeManagement) +
        parseFloat(avgs.satisfaction) +
        parseFloat(avgs.energy)) /
      5
    ).toFixed(1);

    const now = new Date();
    const thisMonth = reflections.filter((r) => {
      const date = new Date(r.datetime);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    const streak = calculateStreak(reflections);

    // Trend data: last 10 entries reversed (oldest first)
    const trendData = reflections.slice(0, 10).reverse();

    return {
      total: count,
      overallAvg,
      thisMonth,
      streak,
      avgs,
      trendData,
    };
  }, [reflections]);

  const barMetrics: { key: keyof typeof stats.avgs; label: string }[] = [
    { key: 'preparation', label: '수업 준비 충실도' },
    { key: 'engagement', label: '학생 집중도/참여도' },
    { key: 'timeManagement', label: '시간 관리' },
    { key: 'satisfaction', label: '자기 만족도' },
    { key: 'energy', label: '에너지 레벨' },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">총 성찰 기록</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.overallAvg}</div>
          <div className="stat-label">전체 평균</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.thisMonth}</div>
          <div className="stat-label">이번 달 기록</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-label">연속 기록 일수</div>
        </div>
      </div>

      {/* Average Scores Bar Chart */}
      <div className="chart-container">
        <div className="chart-title">
          <span>&#128202;</span>
          항목별 평균 점수
        </div>
        <div className="bar-chart">
          {barMetrics.map((metric) => {
            const val = stats.avgs[metric.key];
            const numVal = val === '-' ? 0 : parseFloat(val);
            const widthPercent = (numVal / 5) * 100;

            return (
              <div className="bar-item" key={metric.key}>
                <span className="bar-label">{metric.label}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="bar-value">{val}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="chart-container">
        <div className="chart-title">
          <span>&#128200;</span>
          최근 10회 전체 평균 추이
        </div>
        <div className="trend-chart">
          {stats.trendData.length === 0 ? (
            <div className="empty-state" style={{ width: '100%', padding: '40px 0' }}>
              <p>데이터가 부족합니다</p>
            </div>
          ) : (
            stats.trendData.map((r) => {
              const avg =
                (r.scores.preparation +
                  r.scores.engagement +
                  r.scores.timeManagement +
                  r.scores.satisfaction +
                  r.scores.energy) /
                5;
              const height = (avg / 5) * 100;
              const date = new Date(r.datetime);
              const label = `${date.getMonth() + 1}/${date.getDate()}`;

              return (
                <div
                  className="trend-bar"
                  key={r.id}
                  style={{ height: `${height}%` }}
                >
                  <span className="trend-bar-value">{avg.toFixed(1)}</span>
                  <span className="trend-bar-label">{label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
