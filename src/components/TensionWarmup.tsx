'use client';

import { useState, useEffect } from 'react';

interface WarmupItem {
  id: string;
  emoji: string;
  title: string;
  description: string;
  duration: string;
}

const WARMUP_ITEMS: WarmupItem[] = [
  {
    id: 'power-song',
    emoji: '🎵',
    title: '파워송 1곡',
    description: 'BPM 120-140 이상, 심박수를 끌어올리는 나만의 노래',
    duration: '2분',
  },
  {
    id: 'body-activation',
    emoji: '💪',
    title: '몸 깨우기',
    description: '점핑잭 10회 or 제자리 뛰기. 혈류 산소 공급 → 세로토닌 분비',
    duration: '1분',
  },
  {
    id: 'power-pose',
    emoji: '🦸',
    title: '파워포즈',
    description: '가슴 펴고, 턱 들고, 팔 넓게. 자신감 체감↑ 코르티솔↓',
    duration: '1분',
  },
  {
    id: 'voice-warmup',
    emoji: '🗣️',
    title: '목소리 워밍업',
    description: '허밍 → 아~ 음계 슬라이드 → 오프닝 멘트를 2배 에너지로 읽기',
    duration: '2분',
  },
  {
    id: 'peak-recall',
    emoji: '🔥',
    title: '최고의 순간 회상',
    description: '학생들이 빠져들었던 그 수업, 그 순간의 나를 떠올려',
    duration: '30초',
  },
];

const WARMUP_KEY = 'tension_warmup_v1';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function TensionWarmup() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load saved state (daily reset)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WARMUP_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date === getTodayKey()) {
          setChecked(new Set(data.checked));
          // Auto-collapse if all done
          if (data.checked.length === WARMUP_ITEMS.length) {
            setCollapsed(true);
          }
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Save state on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      WARMUP_KEY,
      JSON.stringify({
        date: getTodayKey(),
        checked: Array.from(checked),
      })
    );
  }, [loaded, checked]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = checked.size / WARMUP_ITEMS.length;
  const allDone = checked.size === WARMUP_ITEMS.length;

  return (
    <div className={`tension-warmup ${allDone ? 'done' : ''}`}>
      <div
        className="tension-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="tension-title-row">
          <span className="tension-icon">{allDone ? '🔥' : '⚡'}</span>
          <span className="tension-title">
            {allDone ? '텐션 MAX — 수업 시작!' : '텐션 워밍업 루틴'}
          </span>
          <span className="tension-progress-badge">
            {checked.size}/{WARMUP_ITEMS.length}
          </span>
        </div>
        <div className="tension-progress-bar">
          <div
            className="tension-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {!collapsed && (
        <div className="tension-items">
          {WARMUP_ITEMS.map((item) => (
            <label
              key={item.id}
              className={`tension-item ${checked.has(item.id) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked.has(item.id)}
                onChange={() => toggle(item.id)}
              />
              <span className="tension-item-emoji">{item.emoji}</span>
              <div className="tension-item-text">
                <span className="tension-item-title">{item.title}</span>
                <span className="tension-item-desc">{item.description}</span>
              </div>
              <span className="tension-item-duration">{item.duration}</span>
            </label>
          ))}
          <div className="tension-tip">
            💡 총 6분 30초. 수업 전에 이것만 하면 첫 마디부터 에너지가 다릅니다.
          </div>
        </div>
      )}
    </div>
  );
}
