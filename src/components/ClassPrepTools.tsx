'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'class_prep_tools_v1';

interface ClassPrepToolsProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export default function ClassPrepTools({ items, onChange }: ClassPrepToolsProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  // Load checked state from localStorage (daily reset)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        if (data.date === todayKey) {
          setChecked(new Set(data.checked));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save checked state
  useEffect(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey, checked: Array.from(checked) })
    );
  }, [checked]);

  const toggleCheck = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addItem = () => {
    onChange([...items, '']);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const next = items.filter((_, i) => i !== index);
    // Adjust checked indices
    const newChecked = new Set<number>();
    checked.forEach((ci) => {
      if (ci < index) newChecked.add(ci);
      else if (ci > index) newChecked.add(ci - 1);
    });
    setChecked(newChecked);
    onChange(next);
  };

  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const filledCount = items.filter((item) => item.trim() !== '').length;
  const checkedCount = Array.from(checked).filter((i) => i < items.length && items[i]?.trim() !== '').length;
  const allDone = filledCount > 0 && checkedCount >= filledCount;

  return (
    <div className={`prep-tools ${allDone ? 'done' : ''}`}>
      <div
        className="prep-tools-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="prep-tools-title-row">
          <span className="prep-tools-icon">{allDone ? '✅' : '🖥️'}</span>
          <span className="prep-tools-title">
            {allDone ? '수업 준비 완료!' : '수업 준비 도구'}
          </span>
          {filledCount > 0 && (
            <span className="prep-tools-badge">
              {checkedCount}/{filledCount}
            </span>
          )}
          <span className="prep-tools-chevron">{collapsed ? '▸' : '▾'}</span>
        </div>
        {filledCount > 0 && (
          <div className="prep-tools-progress-bar">
            <div
              className="prep-tools-progress-fill"
              style={{ width: `${filledCount > 0 ? (checkedCount / filledCount) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="prep-tools-items">
          <p className="prep-tools-desc">수업에 필요한 프로그램, 웹사이트, 자료를 목록으로 관리하세요.</p>
          {items.map((item, index) => (
            <div key={index} className="prep-tools-item">
              <input
                type="checkbox"
                className="prep-tools-checkbox"
                checked={checked.has(index) && item.trim() !== ''}
                onChange={() => toggleCheck(index)}
                disabled={item.trim() === ''}
              />
              <input
                type="text"
                className="prep-tools-input"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={`준비 항목 ${index + 1} (예: PPT 열기, Chrome 탭 준비...)`}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className="prep-tools-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(index);
                }}
                style={{ visibility: items.length > 1 ? 'visible' : 'hidden' }}
                title="항목 삭제"
              >
                -
              </button>
            </div>
          ))}
          <button
            type="button"
            className="prep-tools-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              addItem();
            }}
          >
            + 항목 추가
          </button>
        </div>
      )}
    </div>
  );
}
